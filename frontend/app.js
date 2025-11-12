const form = document.getElementById('resume-form');
const resultsEl = document.getElementById('results');
const experienceWrapper = document.getElementById('experience-wrapper');
const educationWrapper = document.getElementById('education-wrapper');
const projectsWrapper = document.getElementById('projects-wrapper');
const addExperienceBtn = document.getElementById('add-experience');
const addEducationBtn = document.getElementById('add-education');
const addProjectBtn = document.getElementById('add-project');
const template = document.getElementById('text-entry-template');

function createEntry(wrapper, placeholder = '', initialValue = '') {
  const fragment = template.content.cloneNode(true);
  const label = fragment.querySelector('.dynamic-item');
  const textarea = label.querySelector('textarea');
  const removeBtn = label.querySelector('.remove');

  textarea.placeholder = placeholder;
  textarea.value = initialValue;
  textarea.required = wrapper === experienceWrapper;

  removeBtn.addEventListener('click', () => {
    if (wrapper === experienceWrapper && wrapper.children.length === 1) {
      textarea.value = '';
      return;
    }
    label.remove();
  });

  wrapper.appendChild(fragment);
}

function ensureDefaultEntries() {
  if (!experienceWrapper.children.length) {
    createEntry(
      experienceWrapper,
      'Improved platform performance by 35% by optimizing database indexes and caching.',
      'Improved platform performance by 35% by optimizing database indexes and caching.'
    );
    createEntry(
      experienceWrapper,
      'Led cross-functional squad to launch AI-powered feature, resulting in +18% retention.',
      'Led cross-functional squad to launch AI-powered feature, resulting in +18% retention.'
    );
  }

  if (!educationWrapper.children.length) {
    createEntry(
      educationWrapper,
      'B.Sc. Computer Science, University of Waterloo — 2022',
      'B.Sc. Computer Science, University of Waterloo — 2022'
    );
  }

  if (!projectsWrapper.children.length) {
    createEntry(
      projectsWrapper,
      'Built “InsightBoard”, a real-time analytics dashboard with React + D3.js.',
      'Built “InsightBoard”, a real-time analytics dashboard with React + D3.js.'
    );
  }
}

function collectList(wrapper) {
  return Array.from(wrapper.querySelectorAll('textarea'))
    .map(textarea => textarea.value.trim())
    .filter(Boolean);
}

function displayError(message) {
  resultsEl.innerHTML = `
    <div class="card" style="border-color: rgba(220, 38, 38, 0.4); background: #fef2f2;">
      <h3 style="color: #b91c1c;">Something went wrong</h3>
      <p>${message}</p>
    </div>
  `;
}

function highlightList(items = [], label) {
  if (!items.length) return '';
  return `
    <div class="card">
      <h3>${label}</h3>
      <ul>
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
}

function chipRow(values = [], label) {
  if (!values.length) return '';
  return `
    <div class="card">
      <h3>${label}</h3>
      <div class="chip-row">
        ${values.map(value => `<span class="chip">${value}</span>`).join('')}
      </div>
    </div>
  `;
}

function buildResumePreview(payload, analysis) {
  const { improvedSummary, bonusSkills } = analysis;
  const leads = collectList(experienceWrapper);
  const projects = collectList(projectsWrapper);

  return `
    <div class="resume-preview">
      <div>
        <h3>${payload.name}</h3>
        <p>${payload.location || ''} • ${payload.email}${payload.portfolio ? ` • ${payload.portfolio}` : ''}</p>
      </div>
      <div>
        <h3>Summary</h3>
        <pre>${improvedSummary}</pre>
      </div>
      <div>
        <h3>Core Skills</h3>
        <p>${[...(payload.skills || []), ...bonusSkills].join(' • ')}</p>
      </div>
      <div>
        <h3>Experience Highlights</h3>
        <ul>
          ${leads.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      ${projects.length ? `
        <div>
          <h3>Projects</h3>
          <ul>
            ${projects.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

function renderResults(payload, data) {
  const { analysis, nextActions, timestamp } = data;
  const submittedAt = new Date(timestamp).toLocaleString();

  resultsEl.innerHTML = `
    <div class="card">
      <div class="insight-meta">
        <span class="inline-badge">${analysis.domain}</span>
        <span>Confidence score: ${analysis.domainConfidence} / ${analysis.domainConfidence >= 3 ? 'High' : 'Emerging'}</span>
        <span>Generated: ${submittedAt}</span>
      </div>
      <p>${analysis.improvedSummary.split('\n')[0]}</p>
    </div>

    <div class="split">
      ${highlightList(analysis.strengths, 'What You Already Nail')}
      ${highlightList(analysis.quickWins, 'Instant Boost Actions')}
    </div>

    <div class="split">
      ${highlightList(analysis.differentiatedAngles, 'Make Your Resume Different')}
      ${highlightList(analysis.learningPlan, 'What To Learn Next')}
    </div>

    ${analysis.missingSections.length ? highlightList(
      analysis.missingSections.map(section => `Add a section for ${section}.`),
      'Fill These Gaps'
    ) : ''}

    ${chipRow(analysis.bonusSkills, 'Bonus Skills To Add')}

    ${nextActions?.length
      ? `
        <div class="card">
          <h3>Next Three Moves</h3>
          <ul>${nextActions.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
      `
      : ''
    }

    ${buildResumePreview(payload, analysis)}
  `;
}

async function submitForm(event) {
  event.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Analyzing...';
  resultsEl.classList.add('loading');

  const payload = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    location: form.elements.location.value.trim(),
    portfolio: form.elements.portfolio.value.trim(),
    summary: form.elements.summary.value.trim(),
    objective: form.elements.objective.value.trim(),
    skills: form.elements.skills.value
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean),
    experience: collectList(experienceWrapper),
    education: collectList(educationWrapper),
    projects: collectList(projectsWrapper)
  };

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Server error. Please try again.');
    }

    const data = await response.json();
    renderResults(payload, data);
  } catch (error) {
    displayError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Analyze & Build Resume';
    resultsEl.classList.remove('loading');
  }
}

addExperienceBtn.addEventListener('click', () => {
  createEntry(experienceWrapper, 'Describe a quantifiable win or leadership moment.');
});

addEducationBtn.addEventListener('click', () => {
  createEntry(educationWrapper, 'Certificate in Product Strategy, Reforge — 2024');
});

addProjectBtn.addEventListener('click', () => {
  createEntry(projectsWrapper, 'Launched a no-code automation with Zapier that saved 120 hrs/quarter.');
});

form.addEventListener('submit', submitForm);

ensureDefaultEntries();

