import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!["invoice", "payment_proof"].includes(documentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // Verify payment record exists
    const payment = await prisma.outstandingPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (!payment.shipmentId) {
      return NextResponse.json({ error: "Payment record must be linked to a shipment" }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), "uploads", "payments", paymentId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate safe filename
    const timestamp = Date.now();
    const safeFileName = `${documentType}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadDir, safeFileName);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Create document record in shipment documents
    const document = await prisma.shipmentDocument.create({
      data: {
        shipmentId: payment.shipmentId,
        requirementCode: documentType === "invoice" ? "payment_invoice" : "payment_proof",
        label: documentType === "invoice" ? "Outstanding Payment Invoice" : "Outstanding Payment Proof",
        fileName: file.name,
        fileUrl: `/uploads/payments/${paymentId}/${safeFileName}`,
        fileSize: file.size,
        status: "received",
        notes: `Auto-uploaded from Outstanding Payment #${paymentId}`,
        uploadedBy: session.user.id,
        uploadedAt: new Date(),
      },
    });

    // Link document to payment record
    const updateField = documentType === "invoice" ? "invoiceDocumentId" : "paymentProofDocumentId";
    await prisma.outstandingPayment.update({
      where: { id: paymentId },
      data: { [updateField]: document.id },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
      },
    });
  } catch (error) {
    console.error("Outstanding payment upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
