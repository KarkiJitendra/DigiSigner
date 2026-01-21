import hashlib
import io
import os
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
from django.conf import settings
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.fernet import Fernet

def calculate_hash(file_path):
    """
    Calculate the SHA256 hash of a file.
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def sign_pdf(original_pdf_path, signature_image_path, output_path):
    """
    Overlay signature image on the last page of the PDF.
    """
    # Create the signature overlay
    packet = io.BytesIO()
    # Create a new PDF with Reportlab
    can = canvas.Canvas(packet, pagesize=letter)
    # Using fixed coordinates for now: x=400, y=50 (bottom right-ish)
    can.drawImage(signature_image_path, 400, 50, width=150, height=50, mask='auto', preserveAspectRatio=True)
    can.save()

    # Move to the beginning of the StringIO buffer
    packet.seek(0)
    new_pdf = PdfReader(packet)
    
    # Read existing PDF
    existing_pdf = PdfReader(open(original_pdf_path, "rb"))
    output = PdfWriter()
    
    num_pages = len(existing_pdf.pages)
    for i in range(num_pages):
        page = existing_pdf.pages[i]
        if i == num_pages - 1:
            # Merge the signature page (overlay) onto the last page
            page.merge_page(new_pdf.pages[0])
        output.add_page(page)
        
    with open(output_path, "wb") as outputStream:
        output.write(outputStream)
        
    return output_path

# --- Cryptographic Functions ---

def generate_key_pair():
    """
    Generates a private and public key pair.
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return pem_private.decode('utf-8'), pem_public.decode('utf-8')

# For this demo, we use a fixed key from settings or default for encryption of private keys in DB
# In production, use Django's SECRET_KEY or a dedicated key management system
FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())

def encrypt_private_key(private_key_pem):
    """
    Encrypts the private key for storage using Fernet (symmetric encryption).
    """
    f = Fernet(FERNET_KEY)
    return f.encrypt(private_key_pem.encode()).decode()

def decrypt_private_key(encrypted_private_key):
    """
    Decrypts the stored private key.
    """
    f = Fernet(FERNET_KEY)
    return f.decrypt(encrypted_private_key.encode()).decode()

def sign_hash(data_hash, private_key_pem):
    """
    Sign the hash of a document using the private key.
    """
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(),
        password=None
    )
    
    # We insist on signing the hash directly if we calculated it ourselves, 
    # but PSS padding usually hashes the data again. 
    # To sign the *pre-calculated hash*, we use Prehashed.
    
    signature = private_key.sign(
        bytes.fromhex(data_hash), # Convert hex hash back to bytes
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256() # The algorithm used to calculate the hash
    )
    
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(data_hash, signature_b64, public_key_pem):
    """
    Verifies the signature of a document hash.
    """
    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode())
        signature = base64.b64decode(signature_b64)
        
        public_key.verify(
            signature,
            bytes.fromhex(data_hash),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception as e:
        print(f"Verification failed: {e}")
        return False
