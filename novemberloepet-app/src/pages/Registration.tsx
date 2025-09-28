import React, { useState } from 'react';
import { TextField, Button, Box, MenuItem, Typography, Alert } from '@mui/material';
import { useDeltagerContext, Deltager } from '../context/DeltagerContext';

const classes = [
  'Oldtimer',
  'Pre 75',
  'Pre 85',
  'Pre 90',
  'Offroad 2000',
  'Super-EVO',
];

const countries = [
  { code: 'NO', label: 'Norge' },
  { code: 'SE', label: 'Sverige' },
  { code: 'FI', label: 'Finland' },
  { code: 'DK', label: 'Danmark' },
];

const initialState: Deltager = {
  startnummer: '',
  navn: '',
  adresse: '',
  postnr: '',
  nasjon: 'Norge',
  poststed: '',
  telefon: '',
  email: '',
  sykkel: '',
  modell: '',
  teknisk: '',
  preKlasse: '',
  klasse: '',
  starttid: '',
  resultater: [],
};

const Registration: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const { addDeltager } = useDeltagerContext();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; telefon?: string }>({});

  const validateEmail = (email?: string) => {
    if (!email) return '';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? '' : 'Ugyldig e-postadresse';
  };
  const validateTelefon = (tel?: string) => {
    if (!tel) return '';
    // Accept +47 or national, digits, spaces, hyphens; at least 6 digits
    const digits = tel.replace(/[^0-9]/g, '');
    if (digits.length < 6) return 'Telefonnummer for kort';
    const re = /^\+?[0-9 \-]+$/;
    return re.test(tel) ? '' : 'Ugyldig telefonnummer';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'email') setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    if (name === 'telefon') setErrors(prev => ({ ...prev, telefon: validateTelefon(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const emailErr = validateEmail(form.email);
    const telErr = validateTelefon(form.telefon);
    setErrors({ email: emailErr ? emailErr : undefined, telefon: telErr ? telErr : undefined });
    if (emailErr || telErr) return;
    setSaving(true);
    setServerError(null);

    try {
      const res = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        const json = await res.json();
        const created: any = json;
        const toAdd: Deltager = {
          startnummer: form.startnummer,
          navn: form.navn,
          adresse: form.adresse,
          postnr: form.postnr,
          nasjon: form.nasjon,
          poststed: form.poststed,
          telefon: form.telefon,
          email: form.email,
          sykkel: form.sykkel,
          mod: (form as any).mod,
          modell: form.modell,
          teknisk: form.teknisk,
          preKlasse: form.preKlasse,
          klasse: form.klasse,
          starttid: form.starttid,
          resultater: form.resultater || [],
          status: (created && created.status) || 'NONE',
          parseId: (created && (created.objectId || created.id)) || undefined
        };
        addDeltager(toAdd);
      } else {
        const text = await res.text();
        setServerError(`Server feil: ${res.status} ${text}`);
        addDeltager(form);
      }
    } catch (err: any) {
      setServerError(`Kunne ikke lagre til server: ${err.message || err}`);
      addDeltager(form);
    } finally {
      setSaving(false);
      setForm(initialState);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  return (
    <Box maxWidth={500} mx="auto">
      <Typography variant="h5" gutterBottom>Registrer deltager</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Startnummer" name="startnummer" value={form.startnummer} onChange={handleChange} fullWidth margin="normal" required disabled={saving} />
        <TextField label="Navn" name="navn" value={form.navn} onChange={handleChange} fullWidth margin="normal" required disabled={saving} />
        <TextField label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField label="Postnr" name="postnr" value={form.postnr} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField select label="Nasjon" name="nasjon" value={form.nasjon} onChange={handleChange} fullWidth margin="normal" required disabled={saving}>
          {countries.map(c => <MenuItem key={c.code} value={c.label}>{c.label}</MenuItem>)}
        </TextField>
        <TextField label="Poststed" name="poststed" value={form.poststed} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField label="Telefon" name="telefon" value={form.telefon} onChange={handleChange} fullWidth margin="normal" error={!!errors.telefon} helperText={errors.telefon} disabled={saving} />
        <TextField label="E-mail" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" error={!!errors.email} helperText={errors.email} disabled={saving} />
        <TextField label="Sykkel" name="sykkel" value={form.sykkel} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField label="Modell (år)" name="modell" value={form.modell} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField label="Teknisk" name="teknisk" value={form.teknisk} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField label="Pre/Klasse" name="preKlasse" value={form.preKlasse} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <TextField select label="Klasse" name="klasse" value={form.klasse} onChange={handleChange} fullWidth margin="normal" required disabled={saving}>
          {classes.map((cls) => (
            <MenuItem key={cls} value={cls}>{cls}</MenuItem>
          ))}
        </TextField>
        <TextField label="Starttid" name="starttid" value={form.starttid} onChange={handleChange} fullWidth margin="normal" disabled={saving} />
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" disabled={saving || !!errors.email || !!errors.telefon}>
            {saving ? 'Lagrer...' : 'Registrer'}
          </Button>
        </Box>
      </form>

      {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
      {submitted && <Typography color="success.main" mt={2}>Deltager registrert!</Typography>}
    </Box>
  );
};

export default Registration;