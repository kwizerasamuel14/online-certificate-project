/* =====================================================
   Mock database — stands in for the backend until the
   real API is available. Replace with real endpoints
   by setting API_CONFIG.baseUrl in api.js.
   ===================================================== */

const MOCK_DB = {
  nextReqId: 2,
  nextCertId: 2,
  nextSeq: 2,
  requests: [
    {
      id: 'REQ-00001',
      fullName: 'Kwizera Samuel',
      email: 'kwizera.samuel@example.com',
      traineeId: 'USH-INT-2026-00230',
      program: 'Training Program / Frontend Development',
      startDate: '2026-07-03',
      endDate: '2026-09-09',
      projectName: 'Up Skills Hub Online Certificate System',
      projectDescription: 'Built the online certificate request and verification module for the Up Skills Hub platform.',
      accomplishments: 'Designed responsive UI, built the request workflow, and integrated QR-based certificate verification.',
      workLink: 'https://github.com/upskillshub/certificates',
      liveLink: 'https://upskillshub.com',
      finalReport: null,
      logbook: null,
      sourceLink: '',
      declaration: true,
      status: 'pending',
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'REQ-00000',
      fullName: 'Aline Uwase',
      email: 'aline.uwase@example.com',
      traineeId: 'USH-TRA-2026-00118',
      program: 'Training Program / Power BI & Data Analysis',
      startDate: '2026-01-15',
      endDate: '2026-05-20',
      projectName: 'Sales Analytics Dashboard',
      projectDescription: 'Interactive sales dashboard for a retail client using Power BI.',
      accomplishments: 'Data modelling, DAX measures, dashboard design and stakeholder presentation.',
      workLink: '', liveLink: '',
      finalReport: null, logbook: null, sourceLink: '',
      declaration: true,
      status: 'generated',
      submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
  certificates: [
    {
      id: 'CERT-00001',
      certificateNumber: 'USH-2026-PB-000001',
      requestRef: 'REQ-00000',
      studentName: 'Aline Uwase',
      studentEmail: 'aline.uwase@example.com',
      studentId: 'USH-TRA-2026-00118',
      course: 'Training Program / Power BI & Data Analysis',
      startDate: '2026-01-15',
      endDate: '2026-05-20',
      issueDate: '2026-05-25',
      status: 'generated',
      verifyUrl: 'https://upskillshub.com/verify/USH-2026-PB-000001',
    },
  ],
  notifications: [
    {
      id: 'N1', email: 'aline.uwase@example.com',
      title: '🎓 Your certificate is ready!',
      message: 'Congratulations Aline Uwase! Your certificate USH-2026-PB-000001 has been generated and is available for download.',
      date: new Date().toISOString(), read: false,
    },
  ],
  verificationLogs: [],
};
