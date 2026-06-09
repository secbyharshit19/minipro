const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

function gatherText(inputs = []) {
  return inputs.filter(Boolean).join(' ').toLowerCase();
}

const defaultDomain = {
  name: 'Professional Excellence',
  keywords: [],
  learning: [
    'Document a complex initiative that showcases collaboration, planning, and measurable outcomes.',
    'Invest in advanced communication or storytelling workshops to sharpen executive presence.',
    'Develop a personal operating system for prioritization, delegation, and continuous improvement.'
  ],
  differentiators: [
    'Highlight leadership stories that combine people, process, and impact.',
    'Add stakeholder testimonials or performance review quotes to build credibility.',
    'Showcase cross-functional initiatives and how you navigated ambiguity.'
  ],
  bonusSkills: ['Stakeholder management', 'Strategic planning', 'Executive communication']
};

const domainCatalog = [
  {
    name: 'Software Engineering',
    keywords: ['javascript', 'node', 'react', 'java', 'python', 'api', 'microservice', 'full stack'],
    learning: [
      'Build and deploy a cloud-native service with container orchestration (Docker + Kubernetes).',
      'Complete an advanced course on system design focusing on scalability and resilience.',
      'Experiment with integrating generative AI APIs to automate workflows.'
    ],
    differentiators: [
      'Highlight measurable performance improvements (e.g., latency, load times).',
      'Showcase contributions to open-source projects or technical blogging.',
      'Add a section for developer tooling or automation you introduced.'
    ],
    bonusSkills: ['Cloud architecture', 'Observability tooling', 'CI/CD automation']
  },
  {
    name: 'Data Science & AI',
    keywords: ['data', 'ml', 'machine learning', 'tensorflow', 'pytorch', 'analytics', 'sql'],
    learning: [
      'Publish a mini case study applying explainable AI techniques to a real dataset.',
      'Learn to productionize models with MLOps platforms (e.g., MLflow, Vertex AI).',
      'Study responsible AI frameworks and fairness metrics.'
    ],
    differentiators: [
      'Add experiment tracking details, highlighting A/B test lift or ROI.',
      'Include visualizations or dashboards you built and decisions they informed.',
      'Create a one-page portfolio summarizing key models with metrics.'
    ],
    bonusSkills: ['Data storytelling', 'Prompt engineering', 'Vector databases']
  },
  {
    name: 'Product & Growth',
    keywords: ['product', 'growth', 'marketing', 'roadmap', 'ux', 'user research'],
    learning: [
      'Run a mock product discovery sprint and document the insights.',
      'Take an advanced analytics course covering cohort and funnel analysis.',
      'Study experimentation platforms and design multivariate tests.'
    ],
    differentiators: [
      'Quantify impact on activation, retention, or revenue metrics.',
      'Highlight cross-functional leadership moments with designers and engineers.',
      'Add customer testimonial snippets or research quotes.'
    ],
    bonusSkills: ['Story-driven roadmapping', 'Behavioral analytics', 'AI-assisted user research']
  },
  {
    name: 'Cybersecurity',
    keywords: ['security', 'cyber', 'penetration', 'threat', 'compliance', 'iso', 'nist'],
    learning: [
      'Earn a cloud security certification (e.g., CCSP, AWS Security Specialty).',
      'Practice building automation scripts for incident response.',
      'Study adversarial mindset techniques and purple teaming exercises.'
    ],
    differentiators: [
      'Document mean-time-to-detect and mean-time-to-respond improvements.',
      'Show toolchain expertise with SIEM, SOAR, and threat intel platforms.',
      'Add contributions to security communities or conference talks.'
    ],
    bonusSkills: ['Secure SDLC', 'Threat modeling', 'Security automation']
  }
];

function detectDomain(payload) {
  const text = gatherText([
    payload.summary,
    payload.objective,
    ...(payload.skills || []),
    ...(payload.experience || []),
    ...(payload.education || [])
  ]);

  let bestMatch = defaultDomain;
  let bestScore = 0;

  domainCatalog.forEach(domain => {
    const score = domain.keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = domain;
    }
  });

  if (bestScore === 0) {
    return { domain: defaultDomain, score: 0 };
  }

  return { domain: bestMatch, score: bestScore };
}

function craftSummary(name, summary = '', strengths = [], domainName) {
  const base = summary || `Seasoned professional seeking new opportunities in ${domainName}.`;
  const highlight = strengths.length ? strengths.slice(0, 2).join(' • ') : `Focused on delivering measurable improvements in ${domainName}.`;
  return `${base}`.replace(/\s+/g, ' ').trim() +
    `\nKey Value: ${highlight}`;
}

function evaluatePayload(payload) {
  const requiredSections = ['summary', 'skills', 'experience', 'education'];
  const missing = requiredSections.filter(section => {
    const value = payload[section];
    if (Array.isArray(value)) {
      return value.length === 0 || value.every(item => !item.trim());
    }
    return !value || !String(value).trim();
  });

  const strengths = [];
  const enhancements = [];

  if (payload.skills?.length > 5) {
    strengths.push('Broad technical/tool coverage');
  }
  if (payload.summary && /\d+%?/.test(payload.summary)) {
    strengths.push('Uses metrics to demonstrate impact');
  }
  if (payload.experience?.some(item => /lead|managed|mentored|coach/i.test(item))) {
    strengths.push('Highlights leadership/mentorship');
  }
  if (payload.experience?.some(item => /\b(ai|automation|innovation)\b/i.test(item))) {
    strengths.push('Emphasizes innovation and automation');
  }

  if (!payload.summary || payload.summary.length < 140) {
    enhancements.push('Expand summary with 3-4 sentence value proposition and signature wins.');
  }
  if (!payload.experience?.some(item => /\d/.test(item))) {
    enhancements.push('Add quantifiable metrics (%, $, time saved) to experience bullets.');
  }
  if (!payload.skills?.some(skill => /ai|ml|cloud|automation/i.test(skill))) {
    enhancements.push('Incorporate emerging skills (AI tooling, cloud automation) to stand out.');
  }
  if (!payload.projects || payload.projects.length === 0) {
    enhancements.push('Add a Projects section featuring 1-2 standout initiatives.');
  }

  const { domain, score } = detectDomain(payload);
  const learning = domain.learning;
  const differentiators = domain.differentiators;

  const bonusSkills = domain.bonusSkills.filter(skill => !payload.skills?.some(userSkill =>
    userSkill.toLowerCase().includes(skill.toLowerCase())
  ));

  const combinedStrengths = strengths.length ? strengths : ['Clear baseline foundation—add narrative to differentiate.'];

  return {
    domain: domain.name,
    domainConfidence: score,
    missingSections: missing,
    strengths: combinedStrengths,
    quickWins: enhancements,
    differentiatedAngles: differentiators,
    learningPlan: learning,
    bonusSkills,
    improvedSummary: craftSummary(payload.name, payload.summary, combinedStrengths, domain.name)
  };
}

app.post('/api/analyze', (req, res) => {
  const payload = req.body || {};

  if (!payload.name || !payload.email) {
    return res.status(400).json({
      error: 'Name and email are required to personalize the resume analysis.'
    });
  }

  const analysis = evaluatePayload(payload);

  res.json({
    timestamp: new Date().toISOString(),
    analysis,
    nextActions: [
      'Incorporate the improved summary and bonus skills into your resume draft.',
      'Schedule a calendar reminder to revisit and measure progress on the learning plan.',
      'Refresh your online profiles with the updated differentiators.'
    ]
  });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'Resume analyzer API is running.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI Resume Analyzer server listening on port ${PORT}`);
});

