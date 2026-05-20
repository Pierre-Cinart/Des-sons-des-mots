(() => {
  const ROADMAP_URL = "./Data/todo-roadmap.json";
  const STORAGE_KEY = "des-sons-des-mots-roadmap-progress";

  const listNode = document.querySelector("[data-roadmap-list]");
  const percentNode = document.querySelector("[data-progress-percent]");
  const countNode = document.querySelector("[data-progress-count]");
  const branchNode = document.querySelector("[data-roadmap-branch]");
  const progressBarNode = document.querySelector("[data-progress-bar]");
  const exportButton = document.querySelector("[data-export-progress]");
  const importInput = document.querySelector("[data-import-progress]");
  const resetButton = document.querySelector("[data-reset-progress]");

  let roadmap = null;
  let progress = loadProgress();

  function loadProgress() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
      return {};
    }
  }

  function saveProgress() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function getAllTasks() {
    return roadmap.phases.flatMap((phase) => phase.tasks);
  }

  function getPhaseProgress(phase) {
    const done = phase.tasks.filter((task) => progress[task.id]).length;
    return {
      done,
      total: phase.tasks.length,
      percent: phase.tasks.length ? Math.round((done / phase.tasks.length) * 100) : 0
    };
  }

  function updateGlobalProgress() {
    const tasks = getAllTasks();
    const done = tasks.filter((task) => progress[task.id]).length;
    const total = tasks.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    percentNode.textContent = `${percent}%`;
    countNode.textContent = `${done} / ${total}`;
    progressBarNode.style.width = `${percent}%`;
  }

  function renderRoadmap() {
    branchNode.textContent = roadmap.branch;
    listNode.innerHTML = roadmap.phases.map(renderPhase).join("");
    updateGlobalProgress();
  }

  function renderPhase(phase) {
    const phaseProgress = getPhaseProgress(phase);

    return `
      <article class="tracker-phase" data-phase="${phase.id}">
        <button class="tracker-phase__summary" type="button" data-toggle-phase="${phase.id}" aria-expanded="true">
          <span>
            <h2 class="tracker-phase__title">${phase.title}</h2>
            <p class="tracker-phase__goal">${phase.goal}</p>
          </span>
          <span class="tracker-phase__meta" data-phase-progress="${phase.id}">
            ${phaseProgress.done} / ${phaseProgress.total}
          </span>
        </button>

        <div class="tracker-phase__body" data-phase-body="${phase.id}">
          ${phase.tasks.map((task) => renderTask(task)).join("")}
        </div>
      </article>
    `;
  }

  function renderTask(task) {
    const checked = progress[task.id] ? "checked" : "";

    return `
      <label class="tracker-task">
        <input type="checkbox" data-task-id="${task.id}" ${checked}>
        <span>${task.label}</span>
      </label>
    `;
  }

  function refreshPhaseProgress(phaseId) {
    const phase = roadmap.phases.find((item) => item.id === phaseId);
    const phaseProgressNode = document.querySelector(`[data-phase-progress="${phaseId}"]`);

    if (!phase || !phaseProgressNode) {
      return;
    }

    const phaseProgress = getPhaseProgress(phase);
    phaseProgressNode.textContent = `${phaseProgress.done} / ${phaseProgress.total}`;
  }

  function handleTaskChange(event) {
    const checkbox = event.target.closest("[data-task-id]");

    if (!checkbox) {
      return;
    }

    progress[checkbox.dataset.taskId] = checkbox.checked;
    saveProgress();

    const phaseNode = checkbox.closest("[data-phase]");
    refreshPhaseProgress(phaseNode.dataset.phase);
    updateGlobalProgress();
  }

  function handlePhaseToggle(event) {
    const button = event.target.closest("[data-toggle-phase]");

    if (!button) {
      return;
    }

    const phaseId = button.dataset.togglePhase;
    const bodyNode = document.querySelector(`[data-phase-body="${phaseId}"]`);
    const isExpanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!isExpanded));
    bodyNode.hidden = isExpanded;
  }

  function exportProgress() {
    const payload = {
      project: roadmap.project,
      roadmapVersion: roadmap.version,
      exportedAt: new Date().toISOString(),
      progress
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "des-sons-des-mots-progress.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      try {
        const payload = JSON.parse(reader.result);
        progress = payload.progress ?? payload;
        saveProgress();
        renderRoadmap();
      } catch {
        listNode.insertAdjacentHTML(
          "afterbegin",
          '<p class="tracker-error">Import impossible : le fichier JSON ne correspond pas au format attendu.</p>'
        );
      }
    });

    reader.readAsText(file);
  }

  async function initializeRoadmap() {
    try {
      const response = await fetch(ROADMAP_URL);

      if (!response.ok) {
        throw new Error(`Roadmap introuvable (${response.status})`);
      }

      roadmap = await response.json();
      renderRoadmap();
    } catch (error) {
      listNode.innerHTML = `
        <p class="tracker-error">
          Impossible de charger la roadmap JSON. Lance le projet via un serveur local
          pour autoriser le chargement de <code>${ROADMAP_URL}</code>.
        </p>
      `;
    }
  }

  listNode.addEventListener("change", handleTaskChange);
  listNode.addEventListener("click", handlePhaseToggle);
  exportButton.addEventListener("click", exportProgress);
  importInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
      importProgress(file);
    }
  });
  resetButton.addEventListener("click", () => {
    progress = {};
    saveProgress();
    renderRoadmap();
  });

  initializeRoadmap();
})();
