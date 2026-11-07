const PARCEL_QUERY = 'https://www.ocgis.com/survey/rest/services/WebApps/ParcelFeatures/FeatureServer/0/query'
const PARCEL_LAYER = 'https://www.ocgis.com/survey/rest/services/WebApps/ParcelFeatures/FeatureServer/0'
const ZONING_LAYER = 'https://www.ocgis.com/survey/rest/services/WebApps/Map_Layers_Associated_Documents/MapServer/9'

const state = { mode: 'apn', parcels: [], selected: null, compare: new Set(), loading: false }
const $ = (selector) => document.querySelector(selector)
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const fmt = new Intl.NumberFormat('en-US')

function queryUrl(where, resultRecordCount = 18) {
  const params = new URLSearchParams({ where, outFields: '*', returnGeometry: 'true', outSR: '4326', resultRecordCount: String(resultRecordCount), f: 'json' })
  return `${PARCEL_QUERY}?${params}`
}

function cleanTerm(term) { return term.trim().replace(/'/g, "''") }

function screenFor(attrs) {
  const code = String(attrs.ZCLASS || attrs.ZC_DETAIL || '').toUpperCase()
  const category = String(attrs.CAT_DIST || attrs.ZC_DESCR || '').toLowerCase()
  if (!code) return { label: 'Unknown', note: 'No usable zoning code in parcel record.' }
  if (/^(AR|E1|E4|RHE|RE|RS|R1|R2|R2D|R3|R4)$/.test(code) || category.includes('residential')) return { label: 'Met', note: 'Residential signal found in official zoning data.' }
  if (/^(A1|OS|R\/OSP|M1|C1|C2|CC|CH|CN|MX|PA|RP|PC|S|SG)$/.test(code) || /agriculture|open space|commercial|employment|industrial/.test(category)) return { label: 'Conflict', note: 'Non-residential or constrained land-use signal needs review.' }
  return { label: 'Unknown', note: 'Zoning code needs jurisdiction-level confirmation.' }
}

function geometrySummary(geometry) {
  const rings = geometry?.rings || []
  const points = rings.flat().filter((point) => Array.isArray(point) && point.length >= 2)
  if (!points.length) return null
  const xs = points.map((p) => p[0]); const ys = points.map((p) => p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

function normalize(feature) {
  const a = feature.attributes || {}
  const area = Number(a.Shape__Area) || 0
  return { id: String(a.OBJECTID), apn: a.AssessmentNo || 'Unavailable', address: a.SiteAddress || 'Address not published', city: [a.SiteCityState, a.SiteZip5].filter(Boolean).join(' '), acres: area ? area / 43560 : 0, sqft: area, zoning: a.ZC_DETAIL || a.ZCLASS || a.ZC_DESCR || a.CAT_DIST || '', category: a.CAT_DIST || a.ZC_DESCR || '', landUse: a.GPLU_DESC || a.GPLU_CODE || '', legal: a.LegalDescr || '', geometry: geometrySummary(feature.geometry), screen: screenFor(a), source: PARCEL_LAYER }
}

async function search(where, label) {
  state.loading = true
  setStatus(`Looking up ${label} in the official OC Survey layer…`)
  try {
    const response = await fetch(queryUrl(where))
    const payload = await response.json()
    if (payload.error) throw new Error(payload.error.message || 'GIS service returned an error')
    state.parcels = (payload.features || []).map(normalize)
    state.selected = null
    renderResults()
    setStatus(state.parcels.length ? `${state.parcels.length} parcel record${state.parcels.length === 1 ? '' : 's'} returned from OC Survey.` : 'No parcel records matched. Try a shorter APN or street name.')
  } catch (error) {
    state.parcels = []
    renderResults()
    setStatus(`The official GIS request failed: ${error.message}. Try again or verify directly at OC Survey.`, true)
  } finally { state.loading = false }
}

function setStatus(message, error = false) { const node = $('#search-status'); node.textContent = message; node.className = `search-status ${error ? 'error' : ''}` }

function renderResults() {
  const filter = $('#screen-filter').value
  const visible = state.parcels.filter((parcel) => filter === 'all' || parcel.screen.label === filter)
  $('#results-title').textContent = state.parcels.length ? `${visible.length} parcel${visible.length === 1 ? '' : 's'} in view` : 'Search to load parcels'
  $('#compare-count').textContent = state.compare.size
  $('#compare-button').disabled = state.compare.size < 2
  if (!visible.length) { $('#results').innerHTML = '<div class="empty-state"><div class="empty-icon">⌖</div><h3>No matches in this screen</h3><p>Change the screen filter or run another search.</p></div>'; return }
  $('#results').innerHTML = visible.map(card).join('')
  document.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openDetail(button.dataset.open)))
  document.querySelectorAll('[data-compare]').forEach((button) => button.addEventListener('click', () => toggleCompare(button.dataset.compare)))
}

function card(parcel) {
  const selected = state.compare.has(parcel.id)
  return `<article class="parcel-card"><div class="card-top"><span class="status-chip ${parcel.screen.label.toLowerCase()}">${parcel.screen.label}</span><button class="compare-check ${selected ? 'selected' : ''}" data-compare="${escapeHtml(parcel.id)}" aria-label="${selected ? 'Remove from compare' : 'Add to compare'}">${selected ? '✓' : '+'} Compare</button></div><button class="parcel-title" data-open="${escapeHtml(parcel.id)}"><span class="apn">APN ${escapeHtml(parcel.apn)}</span><strong>${escapeHtml(parcel.address)}</strong><span>${escapeHtml(parcel.city || 'Orange County, CA')}</span></button><dl class="facts"><div><dt>Land area</dt><dd>${parcel.sqft ? `${fmt.format(Math.round(parcel.sqft))} sf` : 'Unknown'}${parcel.acres ? ` · ${parcel.acres.toFixed(2)} ac` : ''}</dd></div><div><dt>Zoning</dt><dd>${escapeHtml(parcel.zoning || 'Unknown')}</dd></div></dl><div class="card-footer"><span>${escapeHtml(parcel.screen.note)}</span><button class="text-link" data-open="${escapeHtml(parcel.id)}">View details →</button></div></article>`
}

function toggleCompare(id) { if (state.compare.has(id)) state.compare.delete(id); else if (state.compare.size < 3) state.compare.add(id); renderResults(); if (!$('#compare-section').classList.contains('hidden')) renderCompare() }

function openDetail(id) {
  const parcel = state.parcels.find((item) => item.id === id)
  if (!parcel) return
  state.selected = parcel
  history.replaceState(null, '', `#parcel=${encodeURIComponent(parcel.apn)}`)
  renderDetail()
  $('#detail-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function renderDetail() {
  const parcel = state.selected
  if (!parcel) { $('#detail-section').classList.add('hidden'); return }
  const bounds = parcel.geometry ? `${parcel.geometry.minX.toFixed(5)}, ${parcel.geometry.minY.toFixed(5)} → ${parcel.geometry.maxX.toFixed(5)}, ${parcel.geometry.maxY.toFixed(5)}` : 'Geometry not returned'
  $('#detail-section').classList.remove('hidden')
  $('#detail-section').innerHTML = `<div class="detail-header"><div><div class="section-kicker">PARCEL DETAIL</div><h2>${escapeHtml(parcel.address)}</h2><p class="muted">APN ${escapeHtml(parcel.apn)} · ${escapeHtml(parcel.city)}</p></div><div class="detail-actions"><button class="ghost" id="close-detail">Close</button><button class="primary" id="print-report">Print report ↗</button></div></div><div class="detail-grid"><div class="detail-card"><div class="detail-status"><span class="status-chip ${parcel.screen.label.toLowerCase()}">${parcel.screen.label}</span><strong>Preliminary land-use screen</strong></div><div class="detail-facts"><div><span>Land area</span><strong>${parcel.sqft ? `${fmt.format(Math.round(parcel.sqft))} sq ft` : 'Unknown'}</strong><small>${parcel.acres ? `${parcel.acres.toFixed(2)} acres` : 'No area value returned'}</small></div><div><span>Zoning</span><strong>${escapeHtml(parcel.zoning || 'Unknown')}</strong><small>${escapeHtml(parcel.category || 'No category returned')}</small></div><div><span>Land use</span><strong>${escapeHtml(parcel.landUse || 'Unknown')}</strong><small>OC Survey parcel attribute</small></div><div><span>Geometry</span><strong>${parcel.geometry ? 'Parcel boundary returned' : 'Unknown'}</strong><small>${escapeHtml(bounds)}</small></div></div></div><div class="detail-card source-card"><h3>Source trail</h3><a href="${PARCEL_LAYER}" target="_blank" rel="noreferrer">Official parcel layer ↗</a><a href="${ZONING_LAYER}" target="_blank" rel="noreferrer">Official zoning layer ↗</a><p>Retrieved live in your browser. Confirm the current record before making a purchase or design decision.</p></div></div><div class="report-preview"><div><span class="section-kicker">DUE DILIGENCE STARTER</span><h3>Questions to carry forward</h3></div><ul><li>Confirm the zoning designation and permitted use with the city or county planning desk.</li><li>Confirm parcel area, legal description, access, and any easements with a title report and survey.</li><li>Check flood, environmental, utility, slope, and development constraints before underwriting.</li></ul></div>`
  $('#close-detail').addEventListener('click', () => { state.selected = null; history.replaceState(null, '', location.pathname + location.search); renderDetail() })
  $('#print-report').addEventListener('click', () => printReport(parcel))
}

function printReport(parcel) {
  const report = document.createElement('section')
  report.id = 'print-report-sheet'
  report.innerHTML = `<h1>HomePath Site Scout · Due Diligence Report</h1><p class="print-date">Generated ${new Date().toLocaleString()}</p><hr><h2>${escapeHtml(parcel.address)}</h2><p><strong>APN:</strong> ${escapeHtml(parcel.apn)}<br><strong>City / ZIP:</strong> ${escapeHtml(parcel.city)}<br><strong>Land area:</strong> ${parcel.sqft ? `${fmt.format(Math.round(parcel.sqft))} sq ft (${parcel.acres.toFixed(2)} acres)` : 'Unknown'}<br><strong>Zoning:</strong> ${escapeHtml(parcel.zoning || 'Unknown')}<br><strong>Preliminary screen:</strong> ${parcel.screen.label} — ${escapeHtml(parcel.screen.note)}</p><h3>Source trail</h3><p>${PARCEL_LAYER}<br>${ZONING_LAYER}</p><h3>Next verification steps</h3><ol><li>Confirm zoning and permitted use with the jurisdiction.</li><li>Order title, survey, and legal access review.</li><li>Check environmental, flood, utilities, slope, and development constraints.</li></ol><p class="print-note">This report is a research aid, not a zoning determination, title report, survey, environmental review, or legal opinion.</p>`
  document.body.appendChild(report); window.print(); report.remove()
}

function renderCompare() {
  const parcels = [...state.compare].map((id) => state.parcels.find((parcel) => parcel.id === id)).filter(Boolean)
  if (parcels.length < 2) { $('#compare-section').classList.add('hidden'); return }
  $('#compare-section').classList.remove('hidden')
  $('#compare-section').innerHTML = `<div class="detail-header"><div><div class="section-kicker">SIDE BY SIDE</div><h2>Parcel comparison</h2><p class="muted">Keep the first-pass differences visible while you verify the details.</p></div><button class="ghost" id="close-compare">Close</button></div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Fact</th>${parcels.map((parcel) => `<th>${escapeHtml(parcel.apn)}</th>`).join('')}</tr></thead><tbody>${[['Address', (parcel) => parcel.address], ['City / ZIP', (parcel) => parcel.city], ['Land area', (parcel) => parcel.sqft ? `${fmt.format(Math.round(parcel.sqft))} sf · ${parcel.acres.toFixed(2)} ac` : 'Unknown'], ['Zoning', (parcel) => parcel.zoning || 'Unknown'], ['Screen', (parcel) => parcel.screen.label], ['Source', () => 'OC Survey']].map(([label, getter]) => `<tr><th>${label}</th>${parcels.map((parcel) => `<td>${escapeHtml(getter(parcel))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  $('#close-compare').addEventListener('click', () => $('#compare-section').classList.add('hidden'))
  $('#compare-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; document.querySelectorAll('.mode').forEach((item) => item.classList.toggle('active', item === button)); document.querySelectorAll('.mode').forEach((item) => item.setAttribute('aria-selected', item === button ? 'true' : 'false')); $('#search-input').placeholder = state.mode === 'apn' ? 'Try 891-770-97' : 'Try a street or city' }))
$('#search-form').addEventListener('submit', (event) => { event.preventDefault(); const term = cleanTerm($('#search-input').value); if (!term) return setStatus('Enter an APN or address to search.', true); const where = state.mode === 'apn' ? `AssessmentNo LIKE '%${term}%'` : `(SiteAddress LIKE '%${term}%' OR SiteCityState LIKE '%${term}%')`; search(where, state.mode === 'apn' ? `APN ${term}` : `address ${term}`) })
$('#screen-filter').addEventListener('change', renderResults)
$('#compare-button').addEventListener('click', renderCompare)
document.querySelector('.example').addEventListener('click', () => { state.mode = 'apn'; document.querySelectorAll('.mode').forEach((item) => item.classList.toggle('active', item.dataset.mode === 'apn')); $('#search-input').value = '891-770-97'; $('#search-form').requestSubmit() })

async function loadHash() {
  const apn = new URLSearchParams(location.hash.slice(1)).get('parcel')
  if (!apn) return
  $('#search-input').value = apn
  await search(`AssessmentNo = '${cleanTerm(apn)}'`, `APN ${apn}`)
  if (state.parcels[0]) openDetail(state.parcels[0].id)
}
loadHash()
