import { jsPDF } from 'jspdf';

/**
 * Generate Hospital-Grade Clinical PDF Report
 */
export function generateClinicalPDF({ title, patient, content, maskPhi = false, type = 'Doctor Notes' }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Bar
  doc.setFillColor(15, 118, 110); // brand-700 soft teal
  doc.rect(margin, y, contentWidth, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ClinicNotes — Clinical Documentation Report', margin + 6, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), pageWidth - margin - 6, y + 9, { align: 'right' });

  y += 20;

  // Subtitle / Type
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECORD TYPE: ${type.toUpperCase()}`, margin, y);
  y += 6;

  // Patient Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  const pName = maskPhi ? '[REDACTED]' : (patient?.name || 'Patient');
  const pAge = maskPhi ? '[REDACTED]' : (patient?.age || '38 years');
  const pGender = patient?.gender || 'Not specified';
  const pId = maskPhi ? '[REDACTED]' : (patient?.mrnOrId || 'CN-DEMO-01');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT NAME:', margin + 4, y + 6);
  doc.text('AGE / GENDER:', margin + 60, y + 6);
  doc.text('MRN / UHID:', margin + 115, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(pName, margin + 4, y + 12);
  doc.text(`${pAge} / ${pGender}`, margin + 60, y + 12);
  doc.text(pId, margin + 115, y + 12);

  y += 24;

  // Helper to add clean section
  function addSection(heading, itemsOrText) {
    if (!itemsOrText || (Array.isArray(itemsOrText) && itemsOrText.length === 0)) return;

    if (y > 250) {
      doc.addPage();
      y = 18;
    }

    // Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text(heading.toUpperCase(), margin, y);
    y += 2;

    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    if (typeof itemsOrText === 'string') {
      const splitLines = doc.splitTextToSize(itemsOrText, contentWidth);
      doc.text(splitLines, margin, y);
      y += splitLines.length * 4.5 + 4;
    } else if (Array.isArray(itemsOrText)) {
      itemsOrText.forEach((item) => {
        if (typeof item === 'string') {
          const splitLines = doc.splitTextToSize(`•  ${item}`, contentWidth - 4);
          doc.text(splitLines, margin + 2, y);
          y += splitLines.length * 4.2;
        } else if (typeof item === 'object') {
          // Medicine item
          const medText = `•  ${item.name} (${item.dosage || ''}) — ${item.frequency || ''} [${item.duration || ''}]`;
          const instructionText = item.instructions ? `    Note: ${item.instructions}` : '';
          const lines1 = doc.splitTextToSize(medText, contentWidth - 4);
          doc.setFont('helvetica', 'bold');
          doc.text(lines1, margin + 2, y);
          y += lines1.length * 4.2;

          if (instructionText) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 116, 139);
            const lines2 = doc.splitTextToSize(instructionText, contentWidth - 8);
            doc.text(lines2, margin + 4, y);
            y += lines2.length * 4;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
          }
        }
      });
      y += 4;
    }
  }

  // Render Sections based on data
  if (content.chiefComplaint) {
    addSection('Chief Complaint & Observations', content.chiefComplaint);
  }
  if (content.medicalHistory) {
    addSection('Past Medical History', content.medicalHistory);
  }
  if (content.medicationsGiven || content.medicines) {
    addSection('Prescribed Medications', content.medicationsGiven || content.medicines);
  }
  if (content.testsAndTreatments) {
    addSection('Diagnostic Tests & Procedures', content.testsAndTreatments);
  }
  if (content.keySymptoms) {
    addSection('Reported Symptoms', content.keySymptoms);
  }
  if (content.diagnosis) {
    addSection('Clinical Diagnosis / Impression', content.diagnosis);
  }
  if (content.doctorRecommendations || content.recommendations) {
    addSection('Clinical Advice & Recommendations', content.doctorRecommendations || content.recommendations);
  }
  if (content.followUp) {
    addSection('Follow-Up Plan & Red Flags', content.followUp);
  }

  // Disclaimer Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, margin + contentWidth, pageHeight - 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Confidential Medical Record. AI-generated summary. Review and verify before clinical use.', margin, pageHeight - 8);
  doc.text('ClinicNotes Hospital Suite', margin + contentWidth, pageHeight - 8, { align: 'right' });

  doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
