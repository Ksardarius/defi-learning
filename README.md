# **defi-learning: Foundational On-Chain Token Management on Solana**

This repository showcases a foundational learning project built on the Solana blockchain using the Anchor framework. It serves as a portfolio piece to demonstrate a deep understanding of core on-chain token management concepts, including the use of Program Derived Addresses (PDAs), administrative controls, and interaction with the Solana Program Library (SPL).

## **Project Overview**

The **defi-learning** program implements essential token management instructions, providing a secure and controlled environment for creating and managing an SPL token. This project is a crucial first step in building more complex DeFi protocols, as it establishes the fundamental primitives required for token issuance and transfer.

## **Features**

The program exposes the following key instructions:

* **initialize\_config**: Creates a single Config account using a Program Derived Address (PDA). This account acts as a central hub for program data and establishes the admin role, giving a specific wallet privileged access.  
* **initialize\_token\_mint**: A standard instruction to create a new SPL token mint. The mint authority is assigned to an external keypair, demonstrating a common pattern for initial token setup.  
* **initialize\_program\_controlled\_token\_mint**: A more advanced instruction that creates a new SPL token mint where the mint authority is a PDA derived from the program itself. This is a critical pattern for on-chain programs that need to mint tokens securely without relying on an external signer.  
* **admin\_mint**: A privileged instruction that allows only the designated admin to mint new tokens and transfer them to a specified token account. This demonstrates how to implement role-based access control on the blockchain.  
* **transfer\_token**: A custom wrapper around the standard SPL transfer function. It allows any token holder to securely transfer a specified amount of tokens to another user.

## **Core Concepts**

* **Program Derived Addresses (PDAs)**: The program makes extensive use of PDAs for both the Config account and for a program-controlled mint authority. This is a core concept in Solana development for creating accounts owned by the program, allowing for secure, on-chain state management.  
* **SPL Token Program**: All token operations, including mint creation and transfers, are handled by interacting with the Solana Program Library's Token Program, which is the standard for managing tokens on Solana.  
* **Administrative Privileges**: The initialize\_config and admin\_mint instructions demonstrate how to create and enforce an admin role on the blockchain. By storing the admin's public key in the Config PDA, the program can restrict certain actions to only the authorized user.

## **Getting Started**

To explore and test the functionality of this program, you will need the following tools:

* [**Rust**](https://www.rust-lang.org/tools/install)  
* [**Solana CLI**](https://www.google.com/search?q=https://docs.solana.com/cli/install-solana-cli)  
* [**Anchor CLI**](https://www.anchor-lang.com/docs/installation)  
* [**Node.js**](https://nodejs.org/) and [**Yarn**](https://yarnpkg.com/)

### **Running the Tests**

The provided test suite is the best way to understand and verify the program's functionality.

1. Clone the repository:  
   git clone https://github.com/your-username/defi-learning.git  
   cd defi-learning

2. Install the JavaScript dependencies:  
   yarn install

3. Build the program:  
   anchor build

4. Run the tests. This will start a local validator, deploy the program, and execute the test cases:  
   anchor test

### **Test Case Walkthrough**

The tests/defi-learning.ts file contains two main test suites:

* **defi-learning suite**:  
  * before(): Initializes a central Config account, establishing the wallet running the test as the program's admin.  
  * Can initialize mint account: Verifies the creation of a standard SPL token mint with an external mint authority.  
  * Can initialize program controlled mint account: Tests the creation of a new token mint where the authority is a PDA, a key feature of the program.  
  * must find initialized config: Ensures that the Config account exists and correctly stores the admin's public key.  
  * Can mint tokens: Demonstrates the privileged admin\_mint instruction, successfully minting a large number of tokens to a user's associated token account.  
* **token management suite**:  
  * must mint and transfer tokens: This comprehensive test case ties everything together. It first creates a new program-controlled token mint, then mints new tokens to a user's account via the admin\_mint instruction. Finally, it tests the transferToken instruction, moving tokens between two users and verifying the final balances, showcasing a full on-chain token lifecycle.

## **Potential Improvements & Next Steps**

* **Token Burning**: Implement a burn instruction to allow users to destroy their tokens and reduce the total supply.  
* **Frontend Integration**: Build a simple web interface to connect a wallet and interact with the program's instructions.  
* **Delegated Transfers**: Explore the use of SPL approve and transferFrom instructions to enable delegated token transfers.  
* **Program Updates**: Implement a program upgrade authority to manage future updates to the program.

## **License**

This project is licensed under the MIT License.

## **Contact**

Feel free to reach out to me with any questions or feedback.
https://www.linkedin.com/in/mihails-orlovs-5b602371
