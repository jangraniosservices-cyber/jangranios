import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { PaymentRecord, SiteSettings, StudentRecord } from '../types';

export function downloadAdmissionReceiptPdf(student: StudentRecord, settings: SiteSettings): void {
  const doc = new jsPDF();
  doc.setFillColor(15, 37, 87);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(settings.businessName.toUpperCase(), 14, 16);
  doc.setFontSize(10);
  doc.text('OFFICIAL ADMISSION ACKNOWLEDGEMENT & RECEIPT', 14, 24);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Application No: ${student.applicationNumber}`, 14, 46);
  doc.text(`Student ID: ${student.studentId}`, 14, 53);
  doc.text(`Date Issued: ${new Date().toISOString().slice(0, 10)}`, 145, 46);
  doc.text(`Status: ${student.admissionStatus.toUpperCase()}`, 145, 53);

  autoTable(doc, {
    startY: 62,
    head: [['Field', 'Submitted Student Information']],
    body: [
      ['Full Name', student.fullName],
      ['Date of Birth', student.dob],
      ['Mobile Number', student.mobile],
      ['Email Address', student.email],
      ["Father's Name", student.fatherName],
      ["Mother's Name", student.motherName],
      ['Category', student.category],
      ['Residential Address', student.address],
      ['Previous Qualification', student.previousQualification],
      ['Previous School / Board', student.previousSchoolBoard],
      ['Course Applied For', student.courseApplied],
      ['Study Medium', student.studyMedium],
      ['Subscription Status', `${student.subscriptionStatus.toUpperCase()}${student.subscriptionExpiry ? ` (Valid till ${student.subscriptionExpiry})` : ''}`],
      ['Admin Remarks', student.adminRemarks || 'Under verification'],
    ],
    headStyles: { fillColor: [15, 37, 87] },
    styles: { fontSize: 9.5, cellPadding: 3.5 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Office: ${settings.address}`, 14, finalY + 14);
  doc.text(`Helpline: ${settings.phone} | Email: ${settings.email}`, 14, finalY + 20);
  doc.save(`Admission_Receipt_${student.applicationNumber}.pdf`);
}

export function downloadPaymentReceiptPdf(
  payment: PaymentRecord,
  studentName: string,
  settings: SiteSettings
): void {
  const doc = new jsPDF();
  doc.setFillColor(15, 37, 87);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(settings.businessName.toUpperCase(), 14, 16);
  doc.setFontSize(10);
  doc.text('SUBSCRIPTION PAYMENT RECEIPT', 14, 24);

  autoTable(doc, {
    startY: 46,
    head: [['Receipt Item', 'Details']],
    body: [
      ['Receipt Number', payment.receiptNumber],
      ['Student ID', payment.studentId],
      ['Student Name', studentName],
      ['Subscription Plan', payment.planName],
      ['Amount Paid', `INR ${payment.amount.toFixed(2)}`],
      ['Payment Method', payment.paymentMethod],
      ['Gateway / Order Ref', payment.razorpayOrderId || '-'],
      ['Payment / UPI Ref', payment.upiReference || payment.razorpayPaymentId || '-'],
      ['Status', payment.status.toUpperCase()],
      ['Transaction Timestamp', payment.createdAt],
    ],
    headStyles: { fillColor: [234, 88, 12] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 170;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Computer-generated verified receipt. No card credentials are stored on this portal.', 14, finalY + 12);
  doc.text(`Contact: ${settings.phone} | ${settings.email}`, 14, finalY + 18);
  doc.save(`Payment_Receipt_${payment.receiptNumber}.pdf`);
}

export function exportExcelReport(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number | boolean | null>[]
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportPdfReport(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFillColor(15, 37, 87);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`JANGRA NIOS SERVICES — ${title}`, 14, 15);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 31);

  autoTable(doc, {
    startY: 36,
    head: [columns],
    body: rows,
    headStyles: { fillColor: [15, 37, 87] },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  doc.save(`${filename}.pdf`);
}
