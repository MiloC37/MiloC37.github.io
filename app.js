// app.js
(() => {
  const questions = window.QUIZ_QUESTIONS || [];
  if (!Array.isArray(questions) || questions.length === 0) {
    document.getElementById("card").innerHTML =
      "<p>Missing questions. Check questions.js</p>";
    return;
  }

  const state = {
    index: 0,
    selected: new Array(questions.length).fill(null),
    score: 0,
    submitted: new Array(questions.length).fill(false)
  };

  const card = document.getElementById("card");

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const q = questions[state.index];
    const total = questions.length;
    const i = state.index;

    const selectedIndex = state.selected[i];
    const isSubmitted = state.submitted[i];

    const choiceHtml = q.choices
      .map((c, idx) => {
        const checked = selectedIndex === idx ? "checked" : "";
        const disabled = isSubmitted ? "disabled" : "";
        return `
          <label class="answer">
            <input type="radio" name="choice" value="${idx}" ${checked} ${disabled} />
            <div>${escapeHtml(c)}</div>
          </label>
        `;
      })
      .join("");

    const feedbackHtml = isSubmitted
      ? (() => {
          const correct = q.answerIndex === selectedIndex;
          const klass = correct ? "feedback good" : "feedback bad";
          const msg = correct
            ? "Correct!"
            : `Not quite. Correct answer: ${escapeHtml(q.choices[q.answerIndex])}`;
          return `<div class="${klass}">${msg}</div>`;
        })()
      : `<div class="feedback">Select an answer, then press Submit.</div>`;

    const canSubmit = selectedIndex !== null && !isSubmitted;
    const isLast = i === total - 1;

    card.innerHTML = `
      <div class="question-meta">
        <span class="pill">Question ${i + 1} / ${total}</span>
        <span class="pill">Score: ${state.score} / ${total}</span>
      </div>

      <div class="row">
        <div>
          <h2>${escapeHtml(q.prompt)}</h2>
          <div class="answers">${choiceHtml}</div>

          ${feedbackHtml}

          <div class="controls">
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button id="prevBtn" ${i === 0 ? "disabled" : ""}>Back</button>
              <button id="submitBtn" class="primary" ${canSubmit ? "" : "disabled"}>Submit</button>
              <button id="nextBtn" ${(!isSubmitted) ? "disabled" : ""}>
                ${isLast ? "Finish" : "Next"}
              </button>
            </div>

            <button id="restartBtn">Restart</button>
          </div>
        </div>

        <div class="tweet-box">
          <div id="tweetContainer"></div>
          <div class="feedback" style="margin-top:8px;">
            If the tweet doesn’t load, check the URL and that the tweet is public.
          </div>
        </div>
      </div>
    `;

    wireEvents();
    renderTweet(q.tweetUrl);
  }

  function wireEvents() {
    // radio selection
    card.querySelectorAll('input[name="choice"]').forEach((el) => {
      el.addEventListener("change", (e) => {
        state.selected[state.index] = Number(e.target.value);
        render(); // re-render to enable Submit
      });
    });

    const prevBtn = document.getElementById("prevBtn");
    const submitBtn = document.getElementById("submitBtn");
    const nextBtn = document.getElementById("nextBtn");
    const restartBtn = document.getElementById("restartBtn");

    prevBtn?.addEventListener("click", () => {
      state.index = Math.max(0, state.index - 1);
      render();
    });

    submitBtn?.addEventListener("click", () => {
      const i = state.index;
      if (state.submitted[i]) return;

      state.submitted[i] = true;
      if (state.selected[i] === questions[i].answerIndex) state.score += 1;

      render();
    });

    nextBtn?.addEventListener("click", () => {
      const i = state.index;
      const isLast = i === questions.length - 1;

      if (!state.submitted[i]) return;

      if (isLast) {
        renderResults();
      } else {
        state.index = i + 1;
        render();
      }
    });

    restartBtn?.addEventListener("click", () => {
      state.index = 0;
      state.selected = new Array(questions.length).fill(null);
      state.score = 0;
      state.submitted = new Array(questions.length).fill(false);
      render();
    });
  }

  function renderTweet(tweetUrl) {
    const container = document.getElementById("tweetContainer");
    if (!container) return;

    container.innerHTML = "";

    // Fallback link if embed fails:
    const fallback = document.createElement("a");
    fallback.href = tweetUrl;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Open tweet";
    fallback.className = "pill";
    container.appendChild(fallback);

    // Embed
    const twttr = window.twttr;
    if (!twttr || !twttr.widgets || typeof twttr.widgets.createTweet !== "function") {
      // The script may still be loading; try again shortly.
      setTimeout(() => renderTweet(tweetUrl), 250);
      return;
    }

    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) return;

    // remove fallback pill once embed loads
    twttr.widgets
      .createTweet(tweetId, container, {
        theme: "dark",
        dnt: true
      })
      .then(() => {
        // remove the first child (fallback link) if tweet embed succeeded
        if (container.firstChild === fallback) {
          container.removeChild(fallback);
        }
      })
      .catch(() => {
        // keep fallback link visible
      });
  }

  function extractTweetId(url) {
    // Works for URLs like: https://twitter.com/user/status/123... or x.com/user/status/123...
    const m = String(url).match(/status\/(\d+)/);
    return m ? m[1] : null;
  }

  function renderResults() {
    const total = questions.length;
    const pct = Math.round((state.score / total) * 100);

    card.innerHTML = `
      <div class="question-meta">
        <span class="pill">Finished</span>
        <span class="pill">Score: ${state.score} / ${total} (${pct}%)</span>
      </div>

      <h2>Results</h2>
      <p class="feedback">
        You got <strong>${state.score}</strong> out of <strong>${total}</strong>.
      </p>

      <div class="controls">
        <button id="reviewBtn" class="primary">Review Questions</button>
        <button id="restartBtn">Restart</button>
      </div>
    `;

    document.getElementById("reviewBtn")?.addEventListener("click", () => {
      state.index = 0;
      render();
    });

    document.getElementById("restartBtn")?.addEventListener("click", () => {
      state.index = 0;
      state.selected = new Array(questions.length).fill(null);
      state.score = 0;
      state.submitted = new Array(questions.length).fill(false);
      render();
    });
  }

  render();
})();
