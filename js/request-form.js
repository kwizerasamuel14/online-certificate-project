/* =====================================================
   request-form.js — validation + submission for the
   Request Certificate form.
   ===================================================== */

const TRAINEE_ID_RE = /^USH-(TRA|INT)-\d{4}-\d{4,6}$/;
const URL_RE = /^https?:\/\/.+\..+/;
const MAX_FILE_MB = 10;

const $ = id => document.getElementById(id);
const user = getCurrentUser();
const editId = new URLSearchParams(location.search).get('edit');

/* populate program dropdown (grouped optgroups) */
populateProgramSelect($('program'));

/* prefill from the current demo user */
if (user && user.name) {
  $('fullName').value = user.name;
}
if (user && user.email) {
  $('fullNameEmailHint').textContent = 'Account email: ' + user.email;
}

/* ---- Edit mode: only allowed while Pending Review ---- */
if (editId) {
  API.getRequest(editId).then(r => {
    if (r.status !== 'pending') {
      toast('This request can no longer be edited (status: ' + STATUS_LABELS[r.status] + ').', 'error');
      setTimeout(() => (location.href = 'my-certificates.html'), 1500);
      return;
    }
    $('fullName').value = r.fullName;
    $('traineeId').value = r.traineeId;
    $('program').value = r.program;
    $('startDate').value = r.startDate;
    $('endDate').value = r.endDate;
    $('projectName').value = r.projectName;
    $('projectDescription').value = r.projectDescription;
    $('accomplishments').value = r.accomplishments;
    $('workLink').value = r.workLink || '';
    $('liveLink').value = r.liveLink || '';
    $('sourceLink').value = r.sourceLink || '';
    $('declaration').checked = true;
    document.querySelector('h1').textContent = 'Edit Certificate Request';
    $('submitBtn').textContent = '💾 Save Changes';
  }).catch(() => {
    toast('Request not found.', 'error');
    setTimeout(() => (location.href = 'my-certificates.html'), 1500);
  });
}

function setInvalid(fieldId, invalid) {
  $(fieldId).classList.toggle('invalid', invalid);
  return !invalid;
}

function validate() {
  let ok = true;

  ok = setInvalid('f-fullName', $('fullName').value.trim().length < 3) && ok;

  const tid = $('traineeId').value.trim().toUpperCase();
  $('traineeId').value = tid;
  ok = setInvalid('f-traineeId', !TRAINEE_ID_RE.test(tid)) && ok;

  ok = setInvalid('f-program', !$('program').value) && ok;

  const sd = $('startDate').value, ed = $('endDate').value;
  ok = setInvalid('f-startDate', !sd) && ok;
  ok = setInvalid('f-endDate', !ed || (sd && ed < sd)) && ok;

  ok = setInvalid('f-projectName', $('projectName').value.trim().length < 3) && ok;
  ok = setInvalid('f-projectDescription', $('projectDescription').value.trim().length < 20) && ok;
  ok = setInvalid('f-accomplishments', $('accomplishments').value.trim().length < 300) && ok;

  ['workLink', 'liveLink', 'sourceLink'].forEach(id => {
    const v = $(id).value.trim();
    ok = setInvalid('f-' + id, v !== '' && !URL_RE.test(v)) && ok;
  });

  ok = setInvalid('f-declaration', !$('declaration').checked) && ok;

  return ok;
}

function validateFiles() {
  let ok = true;
  [['finalReport', 'finalReport-err'], ['logbook', 'logbook-err']].forEach(([id, errId]) => {
    const files = $(id).files;
    let bad = false;
    for (const f of files) {
      if (f.size / (1024 * 1024) > MAX_FILE_MB) bad = true;
    }
    $(errId).style.display = bad ? 'block' : 'none';
    if (bad) ok = false;
  });
  return ok;
}

/* live-clear errors as the user types */
$('requestForm').addEventListener('input', e => {
  const field = e.target.closest('.field');
  if (field) field.classList.remove('invalid');
});

$('requestForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!validate()) {
    toast('Please fix the highlighted fields before submitting.', 'error');
    document.querySelector('.field.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!validateFiles()) {
    toast('Uploaded files exceed the allowed size (10 MB).', 'error');
    return;
  }

  const btn = $('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Submitting...';

  try {
    const data = {
      fullName: $('fullName').value.trim(),
      email: (user && user.email) || $('fullName').value.trim().toLowerCase().replace(/\s+/g, '.') + '@example.com',
      traineeId: $('traineeId').value.trim().toUpperCase(),
      program: $('program').value,
      startDate: $('startDate').value,
      endDate: $('endDate').value,
      projectName: $('projectName').value.trim(),
      projectDescription: $('projectDescription').value.trim(),
      accomplishments: $('accomplishments').value.trim(),
      workLink: $('workLink').value.trim(),
      liveLink: $('liveLink').value.trim(),
      sourceLink: $('sourceLink').value.trim(),
      finalReport: $('finalReport').files[0]?.name || null,
      logbook: [...$('logbook').files].map(f => f.name),
      declaration: $('declaration').checked,
    };

    if (editId) {
      await API.updateRequest(editId, data);
      toast('Request updated successfully.');
      setTimeout(() => (location.href = 'my-certificates.html'), 800);
      return;
    }

    const request = await API.submitRequest(data);

    $('requestForm').style.display = 'none';
    document.querySelector('.page-head').style.display = 'none';
    $('successReqId').textContent = request.id;
    $('successScreen').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    toast(err.message || 'Submission failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '📨 Request Certificate';
  }
});
