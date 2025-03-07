import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import {
    Connection,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { sha256 } from "js-sha256";
import { ACTIONS_CORS_HEADERS, BLOCKCHAIN_IDS } from "@solana/actions";

config();

const app = express();

app.use(express.static("public"));

// Solana Blockchain Connection
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
console.log("SOLANA_RPC_URL", SOLANA_RPC_URL);
const connection = new Connection(SOLANA_RPC_URL);

// Your Solana program ID (Replace this with your real program ID)
const PROGRAM_ID = new PublicKey("GVh92ct6ouJXFjxx7rvPXGidjWhKJVtnBjTkywhpCuA");

// Vault PDA (Must match what is used in your Solana program)
const VAULT_SEED = "vault";
const VAULT_DATA_SEED = "vault_data";


// Headers required for Blink actions
const HEADERS = {
    ...ACTIONS_CORS_HEADERS,
    "x-blockchain-ids": BLOCKCHAIN_IDS.mainnet,
    "x-action-version": "2.4",
};

// Required for CORS preflight requests
app.options("/actions/participate", (req, res) => {
    Object.entries(HEADERS).forEach(([key, value]) => {
        res.header(key, value);
    });

    res.status(204).end();
});

app.use(cors());
app.use(express.json());

// **GET /actions/participate** - Returns metadata for the Blink UI
app.get("/actions/participate", cors(), (req: Request, res: Response): void => {
    const response = {
        type: "action",
        icon: `https://static01.nyt.com/images/2016/09/28/us/17xp-pepethefrog_web1/28xp-pepefrog-superJumbo.jpg`,
        label: "Tradedotfun",
        title: "Tradedotfun – The Ultimate Trading Competition App on Solana",
        description: "Drop 0.1 SOL, flex your perp trading skills, and chase the next 100x—no risk, just pure adrenaline. Participate now and outtrade the pack. Got the guts?",
        links: {
            actions: [{ type: "transaction", label: "participate", href: "/actions/participate" }],
        },
    };

    res.set(HEADERS).json(response);
});

// **POST /actions/participate** - Creates the transaction
app.post("/actions/participate", cors(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { account } = req.body;

        if (!account) {
            console.log("❌ Missing account parameter");
            res.status(400).json({ error: "Invalid request parameters" });
            return;
        }

        const payer = new PublicKey(account);

        // Find the Vault PDA
        const [vaultPDA] = PublicKey.findProgramAddressSync([Buffer.from(VAULT_SEED)], PROGRAM_ID);
        const [vaultDataPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from(VAULT_DATA_SEED)],
            PROGRAM_ID
        );


        // Prepare the deposit transaction
        const transaction = await prepareDepositTransaction(
            connection,
            payer,
            vaultPDA,
            vaultDataPDA,
        );

        console.log("✅ Deposit transaction created:", transaction);
        const serializedTx = Buffer.from(transaction.serialize()).toString("base64");

        res.set(HEADERS).json({ type: "transaction", transaction: serializedTx });
    } catch (error) {
        console.error("❌ Deposit transaction error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

function getDepositSolDiscriminator(): Buffer {
    const seed = "global:deposit_sol";
    return Buffer.from(sha256.digest(seed).slice(0, 8)); // First 8 bytes
}


// **Prepare Deposit Transaction Function**
async function prepareDepositTransaction(
    connection: Connection,
    payer: PublicKey,
    vaultPDA: PublicKey,
    vaultDataPDA: PublicKey,
): Promise<VersionedTransaction> {
    // Encode the instruction data
    const instructionData = getDepositSolDiscriminator();

    // Construct the instruction to call deposit_sol
    const depositInstruction = new TransactionInstruction({
        keys: [
            { pubkey: payer, isSigner: true, isWritable: true },
            { pubkey: vaultPDA, isSigner: false, isWritable: true },
            { pubkey: vaultDataPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: instructionData, // ✅ Now contains the correct function identifier
    });

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create the transaction message
    const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions: [depositInstruction],
    }).compileToV0Message();

    return new VersionedTransaction(message);
}

// **Start the Server**
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Blink Express Server running on port ${PORT}`));
