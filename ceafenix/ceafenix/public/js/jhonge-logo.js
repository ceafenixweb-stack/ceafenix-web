class JhongeLogo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initProgress();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
          margin: 20px 0;
        }

        .logo {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width:280px;
          height: 90px;
        }

        .name {
          font-size: 2rem;
          font-weight: bold;
          color: #ff7e67;
        }

        .name span {
          color: #eaeaea;
        }

        .progress {
          height: 6px;
          background: #222;
          border-radius: 10px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #ff7e67, #ff4d6d);
          transition: width 0.2s ease;
        }

        .label {
          font-size: 0.75rem;
          color: #9aa0a6;
        }
      </style>

      <div class="logo">
        <div class="name">&lt;<span>Jhonge</span> /&gt;</div>
        <div class="progress">
          <div class="bar"></div>
        </div>
        <div class="label">building…</div>
      </div>
    `;
  }

  initProgress() {
    const bar = this.shadowRoot.querySelector('.bar');
    const label = this.shadowRoot.querySelector('.label');

    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 7;

      if (progress >= 100) {
        progress = 100;
        bar.style.width = '100%';
        label.textContent = '';
        clearInterval(interval);
      } else {
        bar.style.width = progress + '%';
        label.textContent = ` ${Math.floor(progress)}%`;
      }
    }, 120);
  }
}

customElements.define('jhonge-logo', JhongeLogo);
