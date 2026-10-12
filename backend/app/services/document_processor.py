"""
BizOS AI — Document Processing Service
Handles text extraction, chunking, embedding generation, and vector storage.
"""

import io
import tempfile
from typing import Optional

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings
from app.vectorstore.mongo_vector import MongoVectorStore

settings = get_settings()

# Initialize embeddings model
embeddings_model = None


def get_embeddings_model():
    global embeddings_model
    if embeddings_model is None:
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=settings.GEMINI_API_KEY,
        )
    return embeddings_model


# Text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text() + "\n"
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = DocxDocument(io.BytesIO(file_bytes))
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text.strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from a TXT file."""
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_text(file_bytes: bytes, file_type: str) -> str:
    """Extract text from a file based on its type."""
    extractors = {
        "pdf": extract_text_from_pdf,
        "docx": extract_text_from_docx,
        "txt": extract_text_from_txt,
    }

    extractor = extractors.get(file_type.lower())
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")

    return extractor(file_bytes)


def chunk_text(text: str) -> list[str]:
    """Split text into chunks for embedding."""
    if not text:
        return []
    return text_splitter.split_text(text)


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of text chunks using Gemini."""
    model = get_embeddings_model()
    embeddings = await model.aembed_documents(texts)
    return embeddings


async def process_document(
    file_bytes: bytes,
    file_type: str,
    document_id: str,
    company_id: str,
    source: str,
) -> int:
    """
    Full document processing pipeline:
    1. Extract text
    2. Chunk text
    3. Generate embeddings
    4. Store vectors in MongoDB

    Returns the number of chunks created.
    """
    # Step 1: Extract text
    text = extract_text(file_bytes, file_type)
    if not text:
        return 0

    # Step 2: Chunk text
    chunks = chunk_text(text)
    if not chunks:
        return 0

    # Step 3: Generate embeddings
    embeddings = await generate_embeddings(chunks)

    # Step 4: Prepare chunk documents
    chunk_docs = [
        {"content": chunk, "embedding": embedding}
        for chunk, embedding in zip(chunks, embeddings)
    ]

    # Step 5: Store in vector store
    count = await MongoVectorStore.store_chunks(
        chunks=chunk_docs,
        company_id=company_id,
        document_id=document_id,
        source=source,
    )

    return count
