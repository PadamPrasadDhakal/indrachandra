const BLOOD_GROUP_FULL_FORM = {
  'A+': 'A Positive',
  'A-': 'A Negative',
  'B+': 'B Positive',
  'B-': 'B Negative',
  'AB+': 'AB Positive',
  'AB-': 'AB Negative',
  'O+': 'O Positive',
  'O-': 'O Negative'
};

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const resourceCards = document.querySelectorAll('.resource-card');
const observerTargets = document.querySelectorAll('.section');
const bloodSection = document.getElementById('blood-directory');
const searchInput = document.getElementById('search-input');
const bloodGroupFilter = document.getElementById('blood-group-filter');
const donorTableBody = document.getElementById('donor-table-body');
const emptyState = document.getElementById('empty-state');
const groupSummary = document.getElementById('group-summary');
const donorCount = document.getElementById('donor-count');
const developerBtn = document.getElementById('developer-btn');
const appreciationBtn = document.getElementById('appreciation-btn');
const appreciationLayer = document.getElementById('appreciation-layer');
const developerModal = document.getElementById('developer-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBackdrop = document.getElementById('modal-backdrop');

let donors = [];
let filteredDonors = [];

init();

function init() {
  setupSectionReveal();
  setupResourceCards();
  setupModal();
  setupAppreciation();
  setupFilters();
  loadDonors();
}

function setupSectionReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  observerTargets.forEach((target) => observer.observe(target));
}

function setupResourceCards() {
  resourceCards.forEach((card) => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      const href = card.dataset.href;

      if (href) {
        window.open(href, '_blank', 'noopener');
        return;
      }

      if (action === 'blood') {
        bloodSection.hidden = false;
        bloodSection.classList.add('visible');
        bloodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const section = document.getElementById(action);
      if (section) {
        section.hidden = false;
        section.classList.add('visible');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupFilters() {
  searchInput.addEventListener('input', applyFilters);
  bloodGroupFilter.addEventListener('change', applyFilters);
}

function setupModal() {
  developerBtn.addEventListener('click', () => {
    developerModal.classList.add('open');
    developerModal.setAttribute('aria-hidden', 'false');
  });

  const closeModal = () => {
    developerModal.classList.remove('open');
    developerModal.setAttribute('aria-hidden', 'true');
  };

  modalCloseBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && developerModal.classList.contains('open')) {
      closeModal();
    }
  });
}

function setupAppreciation() {
  if (!appreciationBtn || !appreciationLayer) {
    return;
  }

  appreciationBtn.addEventListener('click', () => {
    appreciationBtn.classList.add('active');
    setTimeout(() => appreciationBtn.classList.remove('active'), 700);

    document.body.style.transition = 'background 0.6s ease';
    document.body.style.background =
      'radial-gradient(circle at 8% 4%, rgba(255, 220, 120, 0.26), transparent 36%),' +
      'radial-gradient(circle at 87% 8%, rgba(60, 123, 214, 0.2), transparent 35%),' +
      'linear-gradient(170deg, #fbfcff 0%, #f1f7ff 45%, #edf5ff 100%)';

    createAppreciationBursts();

    setTimeout(() => {
      document.body.style.background =
        'radial-gradient(circle at 10% 0%, rgba(60, 123, 214, 0.18), transparent 40%),' +
        'radial-gradient(circle at 90% 12%, rgba(31, 159, 255, 0.14), transparent 32%),' +
        'linear-gradient(170deg, #f7fbff 0%, #f2f7ff 45%, #edf5ff 100%)';
    }, 1400);
  });
}

function createAppreciationBursts() {
  const burstCount = 100;

  for (let i = 0; i < burstCount; i += 1) {
    const node = document.createElement('span');
    node.className = 'appreciation-burst';
    node.style.left = `${Math.random() * 100}%`;
    node.style.top = `${78 + Math.random() * 18}%`;
    node.style.animationDelay = `${Math.random() * 0.22}s`;
    node.style.transform = `translateY(0) scale(${0.45 + Math.random() * 0.9})`;

    appreciationLayer.appendChild(node);

    setTimeout(() => {
      node.remove();
    }, 1400);
  }
}

async function loadDonors() {
  try {
    const response = await fetch('blooddata.csv');
    if (!response.ok) {
      throw new Error('Failed to load donor data.');
    }

    const csvText = await response.text();
    donors = parseCsv(csvText);

    // Only keep donors with both valid blood group and valid phone number.
    donors = donors.filter((donor) => {
      return Boolean(donor.name) && isValidBloodGroup(donor.bloodGroup) && hasValidPhone(donor.phone);
    });

    createBloodGroupOptions(donors);
    applyFilters();
  } catch (error) {
    donorTableBody.innerHTML = '';
    emptyState.textContent = 'Unable to load blood donor data at the moment.';
    emptyState.hidden = false;
    console.error(error);
  }
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const record = {};

    headers.forEach((header, index) => {
      record[header] = (cells[index] || '').trim();
    });

    const rawBloodGroup =
      record['blood group'] ||
      record['bloodgroup'] ||
      record['blood_group'] ||
      record['blood group '] ||
      '';

    const rawPhone =
      record.phone ||
      record['phone number'] ||
      record['mobile n0'] ||
      record.mobile ||
      '';

    const normalizedGroup = normalizeBloodGroup(rawBloodGroup);
    const normalizedPhone = normalizePhone(rawPhone);

    return {
      name: record.name || '',
      phone: normalizedPhone,
      address: record.address || '',
      bloodGroup: normalizedGroup,
      bloodGroupLabel: BLOOD_GROUP_FULL_FORM[normalizedGroup] || ''
    };
  });
}

function normalizeBloodGroup(rawValue) {
  const cleaned = String(rawValue || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  const compact = cleaned.replace(/[^A-Z0-9+\-]/g, '');

  if (!cleaned) return '';

  if (compact.startsWith('AB')) {
    if (compact.includes('-') || compact.includes('NEG')) return 'AB-';
    if (compact.includes('+') || compact.includes('POS')) return 'AB+';
  }

  if (compact.startsWith('A') && !compact.startsWith('AB')) {
    if (compact.includes('-') || compact.includes('NEG')) return 'A-';
    if (compact.includes('+') || compact.includes('POS')) return 'A+';
  }

  if (compact.startsWith('B') && !compact.startsWith('AB')) {
    if (compact.includes('-') || compact.includes('NEG')) return 'B-';
    if (compact.includes('+') || compact.includes('POS')) return 'B+';
  }

  if (compact.startsWith('O')) {
    if (compact.includes('-') || compact.includes('NEG')) return 'O-';
    if (compact.includes('+') || compact.includes('POS')) return 'O+';
  }

  if (cleaned.includes('A POSITIVE') || cleaned === 'A+') return 'A+';
  if (cleaned.includes('A NEGATIVE') || cleaned === 'A-') return 'A-';
  if (cleaned.includes('B POSITIVE') || cleaned === 'B+') return 'B+';
  if (cleaned.includes('B NEGATIVE') || cleaned === 'B-') return 'B-';
  if (cleaned.includes('AB POSITIVE') || cleaned === 'AB+') return 'AB+';
  if (cleaned.includes('AB NEGATIVE') || cleaned === 'AB-') return 'AB-';
  if (cleaned.includes('O POSITIVE') || cleaned === 'O+') return 'O+';
  if (cleaned.includes('O NEGATIVE') || cleaned === 'O-') return 'O-';

  // Ignore unknown/garbled values so they never appear in UI filters.
  return '';
}

function normalizePhone(rawValue) {
  return String(rawValue || '').replace(/[^0-9]/g, '');
}

function hasValidPhone(phone) {
  // Accept realistic local/international contact lengths.
  return phone.length >= 7 && phone.length <= 15;
}

function isValidBloodGroup(group) {
  return VALID_BLOOD_GROUPS.includes(group);
}

function createBloodGroupOptions(allDonors) {
  bloodGroupFilter.innerHTML = '<option value="">All Blood Groups</option>';

  const groups = Array.from(
    new Set(
      allDonors
        .map((donor) => donor.bloodGroup)
        .filter((group) => isValidBloodGroup(group))
    )
  ).sort((a, b) => bloodGroupSortOrder(a) - bloodGroupSortOrder(b));

  groups.forEach((group) => {
    const option = document.createElement('option');
    option.value = group;
    option.textContent = `${group} (${BLOOD_GROUP_FULL_FORM[group] || group})`;
    bloodGroupFilter.appendChild(option);
  });
}

function bloodGroupSortOrder(group) {
  const index = VALID_BLOOD_GROUPS.indexOf(group);
  return index >= 0 ? index : 999;
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedGroup = bloodGroupFilter.value;

  filteredDonors = donors.filter((donor) => {
    const searchableText = `${donor.name} ${donor.phone} ${donor.address} ${donor.bloodGroup} ${donor.bloodGroupLabel}`.toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    const matchesGroup = !selectedGroup || donor.bloodGroup === selectedGroup;

    return isValidBloodGroup(donor.bloodGroup) && hasValidPhone(donor.phone) && matchesQuery && matchesGroup;
  });

  renderGroupSummary(filteredDonors);
  renderTable(filteredDonors);
}

function renderGroupSummary(rows) {
  groupSummary.innerHTML = '';

  const counts = VALID_BLOOD_GROUPS.map((group) => {
    const count = rows.filter((donor) => donor.bloodGroup === group).length;
    return { group, count };
  });

  counts.forEach(({ group, count }) => {
    const card = document.createElement('article');
    card.className = 'group-card';
    card.innerHTML = `
      <p class="group-key">${group}</p>
      <p class="group-full">${BLOOD_GROUP_FULL_FORM[group]}</p>
      <p class="group-count">${count} donor${count === 1 ? '' : 's'}</p>
    `;
    groupSummary.appendChild(card);
  });
}

function renderTable(rows) {
  donorTableBody.innerHTML = '';
  donorCount.textContent = String(rows.length);

  if (!rows.length) {
    emptyState.textContent = 'No donors found for this search/filter.';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  rows.forEach((donor) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${escapeHtml(donor.name)}</td>
      <td>${escapeHtml(donor.phone || '-')}</td>
      <td>${escapeHtml(donor.address || '-')}</td>
      <td>${escapeHtml(donor.bloodGroup || '-')}</td>
      <td>${escapeHtml(donor.bloodGroupLabel || '-')}</td>
    `;

    donorTableBody.appendChild(tr);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
