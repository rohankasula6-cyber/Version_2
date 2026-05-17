import React, { useState } from 'react';
import './AddScriptModal.css';

const EMPTY_FORM = {
  script:     '',
  boughtDate: '',
  sellDate:   '',
  quantity:   '',
  buyAmount:  '',
  sellAmount: '',
  sector:     '',
};

export default function AddScriptModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.script.trim())     newErrors.script     = 'Script symbol required';
    if (!form.boughtDate)        newErrors.boughtDate = 'Buy date required';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
      newErrors.quantity = 'Valid quantity required';
    if (!form.buyAmount || isNaN(form.buyAmount) || Number(form.buyAmount) <= 0)
      newErrors.buyAmount = 'Valid buy price required';
    return newErrors;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onAdd({
      script:     form.script.toUpperCase().trim(),
      boughtDate: form.boughtDate,
      sellDate:   form.sellDate || '',
      quantity:   Number(form.quantity),
      buyAmount:  Number(form.buyAmount),
      sellAmount: Number(form.sellAmount) || 0,
      sector:     form.sector || 'Other',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-title-prefix">+</span> ADD SCRIPT ENTRY
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Row 1 */}
          <div className="form-row">
            <div className={`form-field ${errors.script ? 'error' : ''}`}>
              <label className="field-label">SCRIPT SYMBOL</label>
              <input
                className="field-input"
                name="script"
                value={form.script}
                onChange={handleChange}
                placeholder="e.g. NABIL"
                autoFocus
              />
              {errors.script && <span className="field-error">{errors.script}</span>}
            </div>
            <div className="form-field">
              <label className="field-label">SECTOR</label>
              <select className="field-input" name="sector" value={form.sector} onChange={handleChange}>
                <option value="">Select...</option>
                <option>Banking</option>
                <option>Finance</option>
                <option>Hydro</option>
                <option>Insurance</option>
                <option>Telecom</option>
                <option>Manufacturing</option>
                <option>Hotel</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row">
            <div className={`form-field ${errors.boughtDate ? 'error' : ''}`}>
              <label className="field-label">BUY DATE</label>
              <input
                className="field-input"
                type="date"
                name="boughtDate"
                value={form.boughtDate}
                onChange={handleChange}
              />
              {errors.boughtDate && <span className="field-error">{errors.boughtDate}</span>}
            </div>
            <div className="form-field">
              <label className="field-label">SELL DATE <span className="optional">(optional)</span></label>
              <input
                className="field-input"
                type="date"
                name="sellDate"
                value={form.sellDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-row three-col">
            <div className={`form-field ${errors.quantity ? 'error' : ''}`}>
              <label className="field-label">QUANTITY</label>
              <input
                className="field-input"
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                min="1"
              />
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>
            <div className={`form-field ${errors.buyAmount ? 'error' : ''}`}>
              <label className="field-label">BUY PRICE (NPR)</label>
              <input
                className="field-input"
                type="number"
                name="buyAmount"
                value={form.buyAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
              />
              {errors.buyAmount && <span className="field-error">{errors.buyAmount}</span>}
            </div>
            <div className="form-field">
              <label className="field-label">SELL PRICE (NPR) <span className="optional">(opt)</span></label>
              <input
                className="field-input"
                type="number"
                name="sellAmount"
                value={form.sellAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>

          {/* Calculated preview */}
          {form.quantity && form.buyAmount && (
            <div className="modal-preview">
              <div className="preview-row">
                <span>INVESTED</span>
                <span className="gold-text">NPR {(Number(form.quantity) * Number(form.buyAmount)).toLocaleString()}</span>
              </div>
              {form.sellAmount > 0 && (
                <div className="preview-row">
                  <span>P&amp;L</span>
                  <span className={(Number(form.sellAmount) - Number(form.buyAmount)) >= 0 ? 'profit-text' : 'loss-text'}>
                    {((Number(form.sellAmount) - Number(form.buyAmount)) * Number(form.quantity)) >= 0 ? '+' : ''}
                    NPR {((Number(form.sellAmount) - Number(form.buyAmount)) * Number(form.quantity)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>CANCEL</button>
          <button className="btn-submit" onClick={handleSubmit}>
            <span>ADD ENTRY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
