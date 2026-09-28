use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

// ============================================================
// SPACE-TIME PROGRAM
//
// This is data.
// It is NOT hardcoded into the Rust kernel.
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceTimeProgram {
    pub version: u64,
    pub rules: Vec<Rule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub subject: String,
    pub event: String,
    pub instruction: Instruction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Instruction {
    Set {
        variable: String,
        value: String,
    },

    Increment {
        variable: String,
        amount: u64,
    },

    Tell {
        target: String,
        message: String,
    },
}

// ============================================================
// SIGNED PROGRAM PACKAGE
//
// The program and its signature are stored together.
// The private signing key is NOT inside the kernel.
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedProgram {
    pub program: Vec<u8>,
    pub signature: [u8; 64],
}

// ============================================================
// EVENTS
// ============================================================

#[derive(Debug, Clone)]
pub struct Event {
    pub caller: String,
    pub subject: String,
    pub event: String,
}

// ============================================================
// WORLD STATE
// ============================================================

#[derive(Debug, Clone, Default)]
pub struct WorldState {
    pub variables: HashMap<String, String>,
}

// ============================================================
// KERNEL
//
// Fixed machinery.
// It does not contain Button rules, Chart rules,
// Optimization rules, etc.
// ============================================================

pub struct SpaceTimeKernel {
    program: SpaceTimeProgram,
    state: WorldState,
    history: Vec<Event>,
    trusted_key: VerifyingKey,
}

impl SpaceTimeKernel {

    // --------------------------------------------------------
    // BOOT
    //
    // Load the Space-Time Program from trusted storage.
    // --------------------------------------------------------

    pub fn boot(
        program_path: &str,
        trusted_public_key: [u8; 32],
    ) -> Result<Self, String> {

        let trusted_key =
            VerifyingKey::from_bytes(&trusted_public_key)
                .map_err(|e| format!("Invalid trusted key: {e}"))?;

        // Read signed program package.
        let bytes = fs::read(program_path)
            .map_err(|e| format!("Cannot read program: {e}"))?;

        let package: SignedProgram =
            bincode::deserialize(&bytes)
                .map_err(|e| format!("Invalid program package: {e}"))?;

        // Verify the program BEFORE loading it.
        let signature = Signature::from_bytes(&package.signature);

        trusted_key
            .verify(&package.program, &signature)
            .map_err(|_| "PROGRAM REJECTED: invalid signature".to_string())?;

        // Only now do we deserialize the program.
        let program: SpaceTimeProgram =
            bincode::deserialize(&package.program)
                .map_err(|e| format!("Invalid Space-Time Program: {e}"))?;

        println!(
            "[Kernel] Space-Time Program v{} loaded.",
            program.version
        );

        Ok(Self {
            program,
            state: WorldState::default(),
            history: Vec::new(),
            trusted_key,
        })
    }

    // --------------------------------------------------------
    // EVENT DOOR
    //
    // Everything entering the world comes through here.
    // --------------------------------------------------------

    pub fn dispatch(
        &mut self,
        event: Event,
    ) -> Result<WorldState, String> {

        // Find the rule in the currently loaded program.
        let rule = self
            .program
            .rules
            .iter()
            .find(|rule| {
                rule.subject == event.subject
                    && rule.event == event.event
            })
            .ok_or_else(|| {
                format!(
                    "No rule for {}:{}",
                    event.subject,
                    event.event
                )
            })?
            .clone();

        // Execute generic instructions.
        match rule.instruction {

            Instruction::Set {
                variable,
                value,
            } => {
                self.state
                    .variables
                    .insert(variable, value);
            }

            Instruction::Increment {
                variable,
                amount,
            } => {
                let current = self.state
                    .variables
                    .get(&variable)
                    .and_then(|v| v.parse::<u64>().ok())
                    .unwrap_or(0);

                self.state.variables.insert(
                    variable,
                    (current + amount).to_string(),
                );
            }

            Instruction::Tell {
                target,
                message,
            } => {
                println!(
                    "[Kernel] TELL {} -> {}",
                    target,
                    message
                );
            }
        }

        self.history.push(event);

        Ok(self.state.clone())
    }

    // --------------------------------------------------------
    // READ ONLY
    // --------------------------------------------------------

    pub fn state(&self) -> &WorldState {
        &self.state
    }

    pub fn program_version(&self) -> u64 {
        self.program.version
    }
}