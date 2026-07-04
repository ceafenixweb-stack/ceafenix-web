// ═══════════════════════════════════════════════════════════════
// PAGE: PROMO MOCOA — Hereda PromoPage, solo cambia el prefijo
// ═══════════════════════════════════════════════════════════════

import { PromoPage } from "./PromoPage.js";

export class PromoMocoaPage extends PromoPage {
  constructor(props) {
    super(props);
    this._prefijo = "mocoa_promo";
    this._titulo  = "Modal de Promoción — La Nacional Mocoa";
    this._sub     = "Configura el popup que aparece al entrar a La Nacional Mocoa";
    this.state    = { loading: true, guardando: false, form: this._formVacio() };
  }
}
