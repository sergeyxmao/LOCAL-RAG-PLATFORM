


export function renderSettingsPage({ ICONS, renderLayout }) {
  const graphIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  const contextSidebar = `
    <div class="sidebar-context__title">Разделы настроек</div>
    <nav class="settings-anchors" aria-label="Разделы настроек">
      <a class="settings-anchor" href="#" data-settings-tab-link="models">Модели и облако</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="search">Поиск</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="prompt">Системный промпт</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="services">Сервисы</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="diagnostics">Диагностика</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="graph">Граф знаний</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="maintenance">Обслуживание</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="backups">Бэкапы</a>
    </nav>
    <div class="sidebar-context__footer">
      <span>LOCAL-RAG</span>
      <a href="https://github.com/sergeyxmao/local-rag-platform" target="_blank" rel="noopener">GitHub →</a>
    </div>
  `;

  const headerTabs = `
    <nav class="settings-tabs" id="settingsTabs" role="tablist" aria-label="Разделы настроек">
      <button type="button" class="header-tab is-active" data-settings-tab="models" role="tab">${ICONS.settings}<span>Модели и облако</span></button>
      <button type="button" class="header-tab" data-settings-tab="search" role="tab">${ICONS.search}<span>Поиск</span></button>
      <button type="button" class="header-tab" data-settings-tab="prompt" role="tab">${ICONS.fileText}<span>Промпт</span></button>
      <button type="button" class="header-tab" data-settings-tab="services" role="tab">${ICONS.alertCircle}<span>Сервисы</span></button>
      <button type="button" class="header-tab" data-settings-tab="diagnostics" role="tab">${ICONS.check}<span>Диагностика</span></button>
      <button type="button" class="header-tab" data-settings-tab="graph" role="tab">${graphIcon}<span>Граф знаний</span></button>
      <button type="button" class="header-tab" data-settings-tab="maintenance" role="tab">${ICONS.alertCircle}<span>Обслуживание</span></button>
      <button type="button" class="header-tab" data-settings-tab="backups" role="tab">${ICONS.database}<span>Бэкапы</span></button>
    </nav>
  `;

  const content = `
    <main class="settings-page">
      <div class="settings-tab-panel is-active" data-settings-panel="models">
      <div class="settings-card" id="section-models">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.settings}<span>Модели</span></div>
          <span class="settings-hint">Источник: <span class="mono">config/models.yaml</span></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgChatModel">Чат-модель</label>
              <input class="settings-input settings-input--mono" id="cfgChatModel" type="text" readonly />
            </div>
            <div class="settings-field">
              <label for="cfgEmbedModel">Embedding-модель</label>
              <input class="settings-input settings-input--mono" id="cfgEmbedModel" type="text" readonly />
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgOllamaUrl">Базовый URL Ollama</label>
            <input class="settings-input settings-input--mono" id="cfgOllamaUrl" type="text" readonly />
          </div>
          <p class="settings-hint">Модели и эмбеддинги задаются в файле <span class="mono">config/models.yaml</span> и переменных окружения. Редактирование через UI отключено намеренно — это снижает риск рассинхронизации между UI и контейнером.</p>
        </div>
      </div>

      <!-- #8.1.c.fix-2: вся секция с input[type=password] обёрнута в <form>
           autocomplete="off" + onsubmit="return false" — это убирает
           предупреждение «[DOM] Password field is not contained in a form»
           из DevTools (и для статического Add-form, и для динамического
           списка провайдеров с inline-редактированием). -->
      <form class="settings-card" id="section-cloud" autocomplete="off" onsubmit="return false;">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.upload}<span>Облачные провайдеры</span></div>
          <span class="settings-hint">OpenAI-совместимый API · подробности — <a href="/docs/CLOUD_PROVIDER.md" style="color:var(--accent)" target="_blank">CLOUD_PROVIDER.md</a></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-banner" id="cfgCloudBanner"></div>
          <div id="cfgCloudList" style="display:flex;flex-direction:column;gap:10px;">
            <div class="filters-empty">Загрузка списка провайдеров…</div>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="cfgCloudUseDefault" />
            <span>Использовать облако по умолчанию для новых чатов</span>
          </label>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgCloudAddBtn">${ICONS.plus}<span>Добавить провайдера</span></button>
          </div>
          <div class="provider-add-form" id="cfgCloudAddForm" style="display:none">
            <div class="settings-row">
              <div class="settings-field">
                <label for="cfgCloudName">Название провайдера</label>
                <input class="settings-input" id="cfgCloudName" type="text" placeholder="Например: DeepSeek" />
              </div>
              <div class="settings-field">
                <label for="cfgCloudModel">Модель</label>
                <input class="settings-input settings-input--mono" id="cfgCloudModel" type="text" placeholder="Например: deepseek-chat" />
              </div>
            </div>
            <div class="settings-field">
              <label for="cfgCloudBaseUrl">Base URL</label>
              <input class="settings-input settings-input--mono" id="cfgCloudBaseUrl" type="text" placeholder="https://api.deepseek.com" />
            </div>
            <div class="settings-field">
              <label for="cfgCloudApiKey">API Key</label>
              <input class="settings-input settings-input--mono" id="cfgCloudApiKey" type="password" placeholder="sk-..." autocomplete="off" />
            </div>
            <div class="settings-actions">
              <button type="button" class="btn btn--ghost" id="cfgCloudAddCancel">Отмена</button>
              <button type="button" class="btn btn--accent" id="cfgCloudAddSave">${ICONS.check}<span>Добавить</span></button>
            </div>
          </div>
          <p class="settings-hint">Ключи хранятся в БД проекта в plaintext (см. <span class="mono">CLOUD_PROVIDER.md</span>). В API возвращаются замаскированными, в логи не пишутся. В чате выбор провайдера — в шапке. Принимаются только латинские/ASCII-символы — кириллица в ключе вызовет понятную ошибку.</p>
        </div>
      </form>

      <div class="settings-card" id="section-generation">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.settings}<span>Длина ответа модели</span></div>
          <span class="settings-hint">Применяется к облачным провайдерам</span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgGenerationMaxTokens">Максимальная длина ответа модели (токенов)</label>
              <input class="settings-input" id="cfgGenerationMaxTokens" type="number" min="256" max="8192" step="1" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgGenerationSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgGenerationBanner"></div>
          <p class="settings-hint">Сколько токенов модель может потратить на ответ. Для reasoning-моделей (например <span class="mono">deepseek-v4-pro</span>) нужен запас — рассуждение тратит токены из этого лимита, и при низком значении ответ может прийти пустым. Допустимый диапазон <strong>256–8192</strong>, рекомендуется <strong>4096</strong> и выше. Больший лимит — дольше ответ и больше расход токенов облака.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="services">
      <div class="settings-card" id="section-services">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.alertCircle}<span>Сервисы</span></div>
          <button type="button" class="btn btn--ghost" id="cfgServicesRefresh">${ICONS.refresh}<span>Обновить</span></button>
        </div>
        <div class="settings-card__body">
          <div class="services-grid" id="cfgServices">
            <div class="filters-empty">Проверка сервисов…</div>
          </div>
        </div>
      </div>

      <div class="settings-card" id="section-ocr">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>OCR (распознавание сканов)</span></div>
          <span class="settings-hint" id="cfgOcrAvailability">проверяется…</span>
        </div>
        <div class="settings-card__body">
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAutoEmpty" />
            <span>Включить автоматический OCR для PDF-страниц без текста</span>
            <span class="help-tip" tabindex="0" aria-label="Подсказка"><span class="help-tip__icon" aria-hidden="true">?</span><span class="help-tip__bubble" role="tooltip">По умолчанию kb-api сначала пытается извлечь текст из PDF напрямую. Если страница оказалась пустой (например, скан в виде картинки) — на ней запускается OCR через tesseract. Быстро и нужно почти всегда — снимать галочку, только если все ваши PDF гарантированно с цифровым текстом.</span></span>
          </label>
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAll" />
            <span>OCR для всех страниц PDF (медленно)</span>
            <span class="help-tip" tabindex="0" aria-label="Подсказка"><span class="help-tip__icon" aria-hidden="true">?</span><span class="help-tip__bubble" role="tooltip">Включает OCR даже для страниц, где текст уже извлечён напрямую. Полезно для смешанных PDF, где часть текста встроенная, а часть — картинки (схемы, штампы, рукописные пометки на чертежах АСУ ТП). Замедляет импорт в 2–5 раз. С #8.1.c.fix-2 включён по умолчанию — владелец работает в основном со сканами.</span></span>
          </label>
          <div class="settings-banner" id="cfgOcrBanner"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgOcrSave">${ICONS.check}<span>Сохранить</span></button>
          </div>
          <p class="settings-hint">OCR работает локально через <span class="mono">tesseract</span> (rus+eng). Действует только для новых документов; для уже загруженных — кнопка «Переиндексировать» в действиях документа на странице «База знаний → Документы».</p>
        </div>
      </div>

      <div class="settings-card" id="section-indexing">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.refresh}<span>Параллелизм индексации</span></div>
          <span class="settings-hint" id="cfgIndexingStatus"></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgIndexingConcurrency">Сколько документов обрабатывать одновременно</label>
              <input class="settings-input" id="cfgIndexingConcurrency" type="number" min="1" max="4" step="1" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgIndexingSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgIndexingBanner"></div>
          <p class="settings-hint">Сколько документов одновременно проходят полный pipeline индексации (text/OCR → chunking → embeddings → Qdrant). На слабом CPU держите <strong>1</strong> — параллельный pipeline конкурирует за CPU, память и канал к Ollama, что замедляет общее время. На мощной машине можно повысить до 2–3. Максимум — 4. Изменения применяются мгновенно, текущие задачи не прерываются.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="diagnostics">
      <div class="settings-card" id="section-diagnostics">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.check}<span>Готовность системы</span></div>
          <button type="button" class="btn btn--accent" id="cfgDiagRun">${ICONS.refresh}<span>Запустить проверки</span></button>
        </div>
        <div class="settings-card__body">
          <div class="settings-banner" id="cfgDiagBanner"></div>
          <p class="settings-hint" id="cfgDiagSummary">Нажмите «Запустить проверки», чтобы пройтись по 15 пунктам готовности.</p>
          <div class="diag-grid" id="cfgDiagList"></div>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="graph">
        <div class="settings-card" id="section-graph">
          <div class="settings-card__head">
            <div class="settings-card__title">${graphIcon}<span>Граф знаний — конфигурация парсера</span></div>
            <span class="settings-hint">Файлы: <span class="mono">config/graph-parsers.yaml</span>, <span class="mono">config/graph-aliases.yaml</span></span>
          </div>
          <div class="settings-card__body" style="gap:14px;">
            <div class="graph-subtabs" role="tablist" aria-label="Подвкладки графа">
              <button type="button" class="graph-subtab is-active" data-graph-subtab="profiles" role="tab">Профили парсера</button>
              <button type="button" class="graph-subtab" data-graph-subtab="aliases" role="tab">Алиасы signal_kind</button>
              <button type="button" class="graph-subtab" data-graph-subtab="nodetypes" role="tab">Типы узлов</button>
            </div>
            <p class="settings-hint">
              Профили решают, как читать XLSX с таблицами сигналов. Алиасы — как нормализовать значения signal_kind
              (AI/AO/DI/DO/RTD/FI/RS). После любого сохранения kb-api автоматически перечитывает YAML — рестарт не нужен.
              Резервные копии хранятся в <span class="mono">data/config-backups/</span> (последние 10).
            </p>

            <div class="graph-subtab-panel is-active" data-graph-subpanel="profiles">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphProfileCreateBtn">${ICONS.plus}<span>Создать профиль</span></button>
                <button type="button" class="btn" id="graphProfileRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphProfileRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <div class="settings-banner" id="graphProfileBanner"></div>
              <div id="graphProfileList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>

            <div class="graph-subtab-panel" data-graph-subpanel="aliases">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn" id="graphAliasRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphAliasRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <p class="settings-hint" style="margin:0;">
                Чтобы добавить ещё одну форму написания к уже существующему типу — нажмите
                <strong>«+ Добавить алиас»</strong> прямо в карточке нужного значения (AI/AO/DI/DO/…).
                Создание <em>нового</em> канонического значения — операция редкая, она спрятана в
                «Расширенных возможностях» внизу.
              </p>
              <div class="settings-banner" id="graphAliasBanner"></div>
              <div id="graphAliasList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
              <details class="graph-advanced" id="graphAliasAdvanced">
                <summary>Расширенные возможности</summary>
                <div class="graph-advanced__body">
                  <div class="graph-advanced__warn">
                    Создание нового канонического значения нужно, если вы хотите добавить
                    <strong>новый ТИП сигналов</strong> (например, <span class="mono">PFC</span>,
                    <span class="mono">HART</span> или специфичный для другой предметной области).
                    Обычно нужно добавить алиас к существующему AI/AO/DI/DO выше.
                  </div>
                  <div>
                    <button type="button" class="btn btn--accent" id="graphAliasCreateBtn">${ICONS.plus}<span>Создать новое каноническое значение</span></button>
                  </div>
                </div>
              </details>
            </div>

            <div class="graph-subtab-panel" data-graph-subpanel="nodetypes">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphNodeTypeCreateBtn">${ICONS.plus}<span>Создать тип</span></button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphNodeTypeRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <p class="settings-hint" style="margin:0;">
                Типы узлов используются в графе знаний (поле <span class="mono">graph_nodes.type</span>)
                и в чекбоксах <strong>builds</strong> wizard'а профилей парсера. Системные типы
                (<span class="mono">object</span>, <span class="mono">cabinet</span>, <span class="mono">station</span>,
                <span class="mono">card</span>, <span class="mono">channel</span>, <span class="mono">signal</span>,
                <span class="mono">device</span>) встроены и удалить их нельзя; кастомные —
                добавляйте под свою предметную область. Парсер XLSX пока учитывает только семь
                системных кодов; неизвестные коды попадают в <span class="mono">graph_report.warnings</span>
                под кодом <span class="mono">unknown_node_type</span>.
              </p>
              <div id="graphNodeTypeList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>
          </div>
        </div>

        <div class="kb-modal-backdrop" id="graphModalBackdrop">
          <div class="kb-modal" role="dialog" aria-modal="true" style="max-width:840px;">
            <div class="kb-modal__head">
              <div class="kb-modal__title" id="graphModalTitle">Окно</div>
              <button type="button" class="btn btn--ghost btn--icon" id="graphModalCloseBtn" aria-label="Закрыть">${ICONS.x}</button>
            </div>
            <div class="kb-modal__body" id="graphModalBody"></div>
            <div class="kb-modal__foot" id="graphModalFoot"></div>
          </div>
        </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="search">
      <div class="settings-card" id="section-retrieval">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>Поиск (retrieval)</span></div>
          <span class="settings-hint">База: <span class="mono">config/retrieval.yaml</span></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-grid" id="retrievalFields"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="retrievalSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="retrievalReset">Сбросить к значениям из файла</button>
          </div>
          <div class="settings-banner" id="retrievalBanner"></div>
          <p class="settings-hint">Значения из YAML — базовые. Изменения в UI сохраняются в БД и переопределяют файл. Применяются к следующему запросу.</p>
        </div>
      </div>

      <div class="settings-card" id="section-reranking">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>Reranking — модель оценки релевантности</span></div>
          <span class="settings-hint" id="rerankingStatusHint">проверка…</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            Reranker переоценивает кандидатов после semantic+BM25 и возвращает наиболее релевантные.
            Если выбранный режим недоступен (нет ключа, сервис лежит, сеть упала) — автоматически
            используется эвристика, и это видно в бейдже под ответом.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label for="cfgRerankProvider">Режим reranking</label>
              <select class="settings-select" id="cfgRerankProvider">
                <option value="heuristic">Эвристика (без модели, быстро)</option>
                <option value="local">Локальный bge-reranker (приватно, на CPU)</option>
                <option value="jina">Jina API (облако, требует ключ)</option>
              </select>
              <span class="settings-hint" id="cfgRerankProviderHint"></span>
            </div>
            <div class="settings-field">
              <label for="cfgRerankLocalUrl">URL локального reranker-сервиса</label>
              <input type="text" class="settings-input" id="cfgRerankLocalUrl" placeholder="http://localrag-reranker:8090" autocomplete="off" />
              <span class="settings-hint">Дефолт берётся из <span class="mono">RERANKER_LOCAL_URL</span>.</span>
            </div>
            <div class="settings-field">
              <label for="cfgRerankJinaKey">API-ключ Jina</label>
              <input type="password" class="settings-input" id="cfgRerankJinaKey" placeholder="jina_..." autocomplete="off" />
              <span class="settings-hint">Используется только в режиме «Jina». Хранится в БД, при чтении маскируется.</span>
            </div>
          </div>
          <div class="settings-banner settings-banner--warn" id="rerankPrivacyBanner" style="display:none;">
            ⚠️ Режим «Jina» отправляет тексты найденных фрагментов в облачный API. В режимах
            «Локальный» и «Эвристика» документы наружу НЕ отправляются.
          </div>
          <div id="rerankServiceStatus" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgRerankSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgRerankCheck">Проверить доступность</button>
            <button type="button" class="btn btn--ghost" id="cfgRerankClearJinaKey">Удалить ключ Jina</button>
          </div>
          <div class="settings-banner" id="rerankBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-hyde">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>HyDE — гипотетический ответ перед поиском</span></div>
          <span class="settings-hint" id="hydeStatus">выкл</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            HyDE (Hypothetical Document Embeddings): перед semantic-поиском по вашему вопросу
            генерируется гипотетический параграф документа, и эмбеддинг считается по нему,
            а не по сырому вопросу. Лечит «промах слов» — когда в техдоке термины написаны
            не так, как формулирует пользователь. BM25-поиск по-прежнему идёт по сырому
            вопросу. На каждый запрос — один доп. вызов облачной модели (рекомендуем «flash»),
            +2-5 секунд к ответу. По умолчанию выключен — включайте под конкретные сложные
            запросы. При ошибке/таймауте автоматически делается fallback на сырой вопрос,
            это видно в бейдже «HyDE: fallback» под ответом.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label class="settings-toggle" for="cfgHydeEnabled">
                <input type="checkbox" id="cfgHydeEnabled" /> HyDE включён
              </label>
              <span class="settings-hint">Если выключен — semantic-поиск идёт по сырому вопросу, как раньше.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeProviderId">Провайдер для HyDE</label>
              <select class="settings-select" id="cfgHydeProviderId">
                <option value="">— не выбран —</option>
              </select>
              <span class="settings-hint">Любой из «Облачные провайдеры». Рекомендуем быстрый (flash/turbo), не reasoning.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeModel">Модель (опционально)</label>
              <input type="text" class="settings-input settings-input--mono" id="cfgHydeModel" placeholder="по умолчанию — модель провайдера" autocomplete="off" />
              <span class="settings-hint">Перебивает модель провайдера. Оставьте пустым, чтобы взять из настроек провайдера.</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgHydeMaxTokens">maxTokens</label>
              <input type="number" class="settings-input" id="cfgHydeMaxTokens" min="50" max="2000" />
              <span class="settings-hint">Длина гипотетического параграфа. Рекомендуем 300-500.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeTimeoutMs">timeoutMs</label>
              <input type="number" class="settings-input" id="cfgHydeTimeoutMs" min="2000" max="60000" />
              <span class="settings-hint">Таймаут на HyDE-вызов. По истечении — fallback на сырой вопрос.</span>
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgHydePrompt">Промпт HyDE <span class="settings-help" title="Это один из трёх промптов системы. HyDE — срабатывает ПРИ ВОПРОСЕ пользователя: переписывает запрос в гипотетический параграф документа для semantic-поиска. Не путать с промптами контекстного обогащения, которые срабатывают при импорте документа.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgHydePrompt" rows="10"></textarea>
            <span class="settings-hint">Срабатывает при вопросе пользователя — переписывает запрос для поиска (не при импорте).</span>
            <span class="settings-hint" id="cfgHydePromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgHydeSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgHydePromptReset">Сбросить промпт к универсальному</button>
          </div>
          <div class="settings-banner" id="hydeBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-contextual-enrichment">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>Контекстное обогащение чанков (Слой 2)</span></div>
          <span class="settings-hint" id="ceStatus">выкл</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            При импорте текстового документа (docx/txt/md) каждый фрагмент обогащается
            облачным LLM: к нему добавляется краткий контекст «где в документе и о чём»,
            теги и краткое описание. В поиск (semantic + BM25) идёт только <b>контекст + текст</b>;
            теги и описание — лишь метаданные для отображения. Текст фрагмента НЕ переписывается.
            Срабатывает ТОЛЬКО при импорте/переимпорте текстовых документов (PDF не затрагивается).
            +1 вызов облачной модели на каждый фрагмент. При ошибке/таймауте/без провайдера —
            фрагмент индексируется без обогащения (graceful fallback). По умолчанию выключено.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label class="settings-toggle" for="cfgCeEnabled">
                <input type="checkbox" id="cfgCeEnabled" /> Обогащение включено
                <span class="settings-help" title="Включает контекстное обогащение фрагментов при импорте. Если выключено — фрагменты индексируются как раньше, без контекста и тегов.">?</span>
              </label>
              <span class="settings-hint">Срабатывает при импорте/переимпорте текстовых документов.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeProviderId">Провайдер для обогащения <span class="settings-help" title="Какой облачный провайдер (из «Облачные провайдеры») использовать для генерации контекста и тегов при импорте.">?</span></label>
              <select class="settings-select" id="cfgCeProviderId">
                <option value="">— не выбран —</option>
              </select>
              <span class="settings-hint">Рекомендуем быстрый (flash/turbo), не reasoning — вызов идёт на каждый фрагмент.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeModel">Модель для обогащения <span class="settings-help" title="Перебивает модель провайдера для обогащения. Для обогащения выбирайте быструю flash/turbo-модель — вызов идёт на КАЖДЫЙ фрагмент, reasoning-pro модели будут дорогими и медленными. Выберите из списка-подсказки или впишите свою. Пусто — возьмётся модель провайдера.">?</span></label>
              <input type="text" class="settings-input settings-input--mono" id="cfgCeModel" list="cfgCeModelSuggestions" placeholder="напр. deepseek-v4-flash" autocomplete="off" />
              <datalist id="cfgCeModelSuggestions">
                <option value="deepseek-v4-flash"></option>
                <option value="deepseek-chat"></option>
                <option value="gemini-2.5-flash"></option>
                <option value="gpt-4o-mini"></option>
                <option value="qwen-turbo"></option>
              </datalist>
              <span class="settings-hint">Для обогащения выбирайте быструю flash/turbo-модель — вызов идёт на каждый фрагмент. Выберите из списка или впишите свою; пусто — модель провайдера.</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgCeMaxTokens">maxTokens <span class="settings-help" title="Максимальная длина ответа модели на один фрагмент (контекст + теги + описание в JSON). Рекомендуем 800–1500.">?</span></label>
              <input type="number" class="settings-input" id="cfgCeMaxTokens" min="200" max="4000" />
              <span class="settings-hint">Длина ответа модели на фрагмент. Рекомендуем 800–1500.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeTimeoutMs">timeoutMs <span class="settings-help" title="Таймаут на один вызов обогащения. По истечении — фрагмент индексируется без обогащения (fallback), импорт не падает.">?</span></label>
              <input type="number" class="settings-input" id="cfgCeTimeoutMs" min="5000" max="120000" />
              <span class="settings-hint">Таймаут на вызов. По истечении — fallback без обогащения.</span>
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgCeContextPrompt">Промпт контекста <span class="settings-help" title="Один из трёх промптов системы. ПРОМПТ КОНТЕКСТА — срабатывает ПРИ ИМПОРТЕ документа: добавляет к фрагменту краткий контекст (где в документе и о чём). Идёт в поиск вместе с текстом. Не путать с HyDE (срабатывает при вопросе) и промптом тегов/описания.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgCeContextPrompt" rows="8"></textarea>
            <span class="settings-hint">Срабатывает при импорте документа — добавляет контекст к фрагментам (идёт в поиск).</span>
            <span class="settings-hint" id="cfgCeContextPromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-field">
            <label for="cfgCeMetaPrompt">Промпт тегов/описания <span class="settings-help" title="Один из трёх промптов системы. ПРОМПТ ТЕГОВ/ОПИСАНИЯ — срабатывает ПРИ ИМПОРТЕ: генерирует теги и краткое описание фрагмента. Это только метаданные для отображения/фильтров — в поиск (вектор и BM25) НЕ идут. Не путать с HyDE и промптом контекста.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgCeMetaPrompt" rows="6"></textarea>
            <span class="settings-hint">Срабатывает при импорте — генерирует теги и описание (метаданные, в поиск не идут).</span>
            <span class="settings-hint" id="cfgCeMetaPromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgCeSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgCeContextPromptReset">Сбросить промпт контекста</button>
            <button type="button" class="btn btn--ghost" id="cfgCeMetaPromptReset">Сбросить промпт тегов/описания</button>
          </div>
          <div class="settings-banner" id="ceBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-knowledge-extraction">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>Извлечение знаний из документов (Память инженера)</span></div>
          <span class="settings-hint" id="keStatus">выкл</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">LLM читает текст документа и извлекает случаи (оборудование / что произошло / что сделали). Запускается ВРУЧНУЮ кнопкой «Извлечь знания» у текстового документа в Базе знаний. Извлечённое — <strong>черновики</strong>: они попадают в очередь «Кандидаты» (Граф знаний → Кандидаты), а в граф — <strong>только после вашего «Подтвердить»</strong>. Поддерживаются только текстовые документы (docx / txt / md); PDF и XLSX — вне scope.</p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label class="settings-toggle" for="cfgKeEnabled">
                <input type="checkbox" id="cfgKeEnabled" /> Извлечение включено
                <span class="settings-help" title="Главный тумблер. Если выключен — кнопка «Извлечь знания» вернёт понятное сообщение и ничего не создаст. Извлечение запускается ТОЛЬКО вручную, не при импорте документов.">?</span>
              </label>
              <span class="settings-hint">Включает ручную кнопку «Извлечь знания» у текстовых документов.</span>
            </div>
            <div class="settings-field">
              <label for="cfgKeProviderId">Провайдер для извлечения <span class="settings-help" title="Любой из «Облачные провайдеры». ВНИМАНИЕ: текст документа уходит в облако этого провайдера. Рекомендуем быстрый flash/turbo.">?</span></label>
              <select class="settings-select" id="cfgKeProviderId"><option value="">— не выбран —</option></select>
              <span class="settings-hint">Текст документа отправляется этому провайдеру. Рекомендуем flash/turbo.</span>
            </div>
            <div class="settings-field">
              <label for="cfgKeModel">Модель (опционально) <span class="settings-help" title="Перебивает модель провайдера. Оставьте пустым, чтобы взять модель из настроек провайдера.">?</span></label>
              <input type="text" class="settings-input settings-input--mono" id="cfgKeModel" placeholder="по умолчанию — модель провайдера" autocomplete="off" />
              <span class="settings-hint">Оставьте пустым, чтобы взять модель из настроек провайдера.</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgKeMaxTokens">maxTokens <span class="settings-help" title="Максимум токенов в ответе модели на один фрагмент. Извлечение возвращает JSON-массив случаев — нужно с запасом. Рекомендуем 1500–3000.">?</span></label>
              <input type="number" class="settings-input" id="cfgKeMaxTokens" min="500" max="8000" />
              <span class="settings-hint">Длина JSON-ответа со случаями. Рекомендуем 1500–3000.</span>
            </div>
            <div class="settings-field">
              <label for="cfgKeTimeoutMs">timeoutMs <span class="settings-help" title="Таймаут на один вызов модели (на фрагмент). По истечении фрагмент пропускается; если упали все фрагменты — задача завершится со статусом «ошибка», граф не затронут.">?</span></label>
              <input type="number" class="settings-input" id="cfgKeTimeoutMs" min="5000" max="180000" />
              <span class="settings-hint">Таймаут на вызов модели. По истечении — graceful fallback, ничего не создаётся.</span>
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgKePrompt">Промпт извлечения <span class="settings-help" title="Системный промпт LLM для извлечения случаев. Срабатывает при ручном запуске «Извлечь знания». Доменно-агностичен: просит вернуть строгий JSON {cases:[...]} и переносить факты (серийники, даты, адреса) дословно. Редактируйте под свою предметную область.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgKePrompt" rows="12"></textarea>
            <span class="settings-hint">Срабатывает при ручном запуске «Извлечь знания». Факты (серийники, даты, адреса) модель переносит дословно; ответ — строгий JSON {cases:[...]}.</span>
            <span class="settings-hint" id="cfgKePromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgKeSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgKePromptReset">Сбросить промпт к универсальному</button>
          </div>
          <div class="settings-banner" id="keBanner"></div>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="prompt">
      <div class="settings-card" id="section-prompt">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>Системный промпт</span></div>
          <span class="settings-hint" id="promptStatus"></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-field">
            <label for="cfgPromptTemplate">Шаблон промпта</label>
            <textarea class="settings-input settings-input--mono" id="cfgPromptTemplate" rows="14"></textarea>
            <div class="settings-banner" id="cfgPromptWarn"></div>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgPromptSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgPromptReset">Восстановить по умолчанию</button>
          </div>
          <div class="settings-banner" id="cfgPromptBanner"></div>
          <p class="settings-hint">Доступные плейсхолдеры:</p>
          <ul class="settings-hint" style="margin:0;padding-left:18px;">
            <li><span class="mono">{sources}</span> — найденные фрагменты документов</li>
            <li><span class="mono">{question}</span> — текущий вопрос пользователя</li>
            <li><span class="mono">{history}</span> — последние сообщения чата (для контекста)</li>
            <li><span class="mono">{graph_facts}</span> — структурные факты из графа знаний (оборудование, сигналы, связи)</li>
          </ul>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="maintenance">
      <div class="settings-card" id="section-maintenance">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.alertCircle}<span>Обслуживание</span></div>
        </div>
        <div class="settings-card__body">
          <div class="settings-actions">
            <button type="button" class="btn" id="cfgMaintRebuild">${ICONS.refresh}<span>Пересобрать Qdrant</span></button>
            <span class="settings-hint">Из PostgreSQL без потери документов.</span>
          </div>
          <div class="danger-block">
            <div class="danger-block__text">
              <strong>Сброс содержимого.</strong> Удалит ВСЕ документы, чанки, страницы и Qdrant points. Системный раздел и схема сохранятся. Файлы в <span class="mono">data/raw</span> по умолчанию остаются.
            </div>
            <button type="button" class="btn btn--danger" id="cfgMaintReset">${ICONS.trash}<span>Сброс содержимого</span></button>
          </div>
          <div class="settings-banner" id="cfgMaintBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-theme">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.moon}<span>Тема интерфейса</span></div>
          <span class="settings-hint">Личный выбор — в шапке боковой панели</span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgThemeDefault">Тема по умолчанию для новых пользователей</label>
              <select class="settings-select" id="cfgThemeDefault">
                <option value="dark">Тёмная</option>
                <option value="light">Светлая</option>
                <option value="system">Системная</option>
              </select>
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgThemeSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgThemeBanner"></div>
          <p class="settings-hint">Применяется к пользователям без личного выбора темы. Личный выбор хранится в <span class="mono">localStorage.localrag.theme</span> и не перезаписывается.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="backups">
      <div class="settings-card" id="section-backups">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.database}<span>Бэкапы</span></div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button type="button" class="btn btn--ghost btn--icon" id="cfgBackupRefresh" aria-label="Обновить">${ICONS.refresh}</button>
            <button type="button" class="btn btn--accent" id="cfgBackupCreate">${ICONS.plus}<span>Создать бэкап</span></button>
          </div>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            <strong>Включает:</strong> PostgreSQL (документы, чанки, knowledge_nodes, чаты, настройки).
            <strong>НЕ включает:</strong> Qdrant (vector store) и файлы в <span class="mono">data/raw</span>.
            После восстановления может потребоваться «Пересобрать Qdrant», если бэкап старше текущих индексов.
          </p>
          <div class="settings-banner" id="cfgBackupBanner"></div>
          <div id="cfgBackupList" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div class="settings-row" style="border-top:1px solid var(--border);padding-top:12px;">
            <div class="settings-field">
              <label for="cfgRestoreFile">Восстановить из файла (.sql или .sql.gz)</label>
              <input class="settings-input" id="cfgRestoreFile" type="file" accept=".sql,.gz,.sql.gz" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--danger" id="cfgRestoreUpload" style="align-self:end">${ICONS.upload}<span>Восстановить из файла</span></button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  `;

  const initialState = { icons: {} };
  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "settings",
    pageTitle: "Настройки",
    pageDocumentTitle: "Настройки — LOCAL-RAG",
    content,
    headerTabs,
    contextSidebar,
    // CSS/JS страницы — статические файлы (src/assets/uiV2); settings.js
    // включает и скрипт вкладки «Граф знаний» (бывший renderGraphTabScript).
    pageScript: `window.__UIV2_STATE__ = ${initialStateJson};`,
    stylesheets: ["/ui/assets/uiV2/settings.css"],
    scripts: ["/ui/assets/uiV2/settings.js"],
    bodyClass: "page-settings",
  });
}
