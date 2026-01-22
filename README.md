# DigiSigner

DigiSigner is a secure web-based digital signature platform built with Django. It allows users to upload, sign, and verify documents using cryptographic security.

## Features

- **User Authentication**: Secure registration and login system.
- **Dashboard**: Centralized hub for managing documents and signatures.
- **Signature Management**: Upload and store your personal digital signature.
- **Cryptographic Keys**: Generate unique Public/Private key pairs for secure signing.
- **Document Signing**: Upload documents (PDF) and digitally sign them using your private key and stored signature image.
- **Verification**: Verify the authenticity of signed documents to ensure they haven't been tampered with.

## Tech Stack

- **Backend**: Python 3.12, Django 6.0
- **Database**: SQLite (Development), PostgreSQL (Production ready)
- **Frontend**: HTML5, CSS3, JavaScript
- **Security**: `cryptography` library for digital signatures and hashing.
- **Utilities**: `Pillow` for image processing, `python-decouple` for configuration.

## Installation

### Prerequisites

- Python 3.10+
- pip (Python package manager)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/DigiSigner.git
   cd DigiSigner
   ```

2. **Create a virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory (based on `.env.example` if available) or ensure `settings.py` defaults work for development.

   ```env
   SECRET_KEY=your_secret_key
   DEBUG=True
   ```

5. **Apply Migrations**

   ```bash
   python manage.py migrate
   ```

6. **Run the Server**

   ```bash
   python manage.py runserver
   ```

   Access the application at `http://127.0.0.1:8000/`.

## Usage

1. **Register** for a new account.
2. Go to **Generate Keys** to create your cryptographic key pair.
3. **Upload your Signature** image via the dashboard.
4. **Upload a Document** you wish to sign.
5. Click **Sign** on the document to apply your signature and cryptographic hash.
6. Use the **Verify** tool to check the validity of any signed document.

## License

This project is licensed under the MIT License.
