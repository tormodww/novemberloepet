import { Alert,Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import React, { useEffect,useState } from 'react';

import { createDeltagere } from '../api/deltagere';
import type { Deltager } from '../api/types';
import { useDeltagerContext } from '../context/DeltagerContext';
import { usePersistentState } from '../hooks/usePersistentState';

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
  const [form, setForm] = usePersistentState<Deltager>('registration.form', initialState);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; telefon?: string; startnummer?: string }>({});
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);

  const { deltagere, addDeltager } = useDeltagerContext();

  // When participants change, default startnummer to max+1 if the form doesn't already have one
  useEffect(() => {
    try {
      if (!form.startnummer) {
        const nums = deltagere.map(d => parseInt(String(d.startnummer) || '0', 10)).filter(n => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        const next = String(max + 1);
        setForm(prev => ({ ...prev, startnummer: next }));
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deltagere.length]);

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
    // Fjernet unødvendig escape av '-'
    const re = /^\+?[0-9 -]+$/;
    return re.test(tel) ? '' : 'Ugyldig telefonnummer';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startnummer') {
      // strip non-digits and normalize to numeric string (remove leading zeros)
      const digits = (value || '').replace(/\D/g, '');
      const normalized = digits ? String(parseInt(digits, 10)) : '';
      setForm({ ...form, [name]: normalized });
      // numeric duplicate check (handles "01" vs "1")
      const collision = deltagere.some(d => Number(d.startnummer) === Number(normalized));
      setErrors(prev => ({ ...prev, startnummer: collision ? 'Startnummeret er allerede registrert' : undefined }));
      return;
    }

    setForm({ ...form, [name]: value });
    if (name === 'email') setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    if (name === 'telefon') setErrors(prev => ({ ...prev, telefon: validateTelefon(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const emailErr = validateEmail(form.email);
    const telErr = validateTelefon(form.telefon);
    // recompute startnummer collision check as final guard
    const startCollision = deltagere.some(d => Number(d.startnummer) === Number(form.startnummer));
    const startErr = startCollision ? 'Startnummeret er allerede registrert' : undefined;
    setErrors({ email: emailErr ? emailErr : undefined, telefon: telErr ? telErr : undefined, startnummer: startErr });
    if (emailErr || telErr || startErr) return;
    setSaving(true);
    setServerError(null);

    try {
      const created = await createDeltagere(form as any);
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
      setRegisteredMessage(`Deltager ${toAdd.navn} er registrert med startnummer ${toAdd.startnummer}`);
    } catch (err: any) {
      setServerError(`Kunne ikke lagre til server: ${err.message || err}`);
      addDeltager(form);
      setRegisteredMessage(`Deltager ${form.navn} er registrert med startnummer ${form.startnummer}`);
    } finally {
      setSaving(false);
      // keep form persisted but clear after successful attempt
      setForm(initialState);
      // clear the success message after a short delay
      setTimeout(() => setRegisteredMessage(null), 2000);
    }
  };

  return (
    <Box maxWidth={500} mx="auto">
      <Typography variant="h5" gutterBottom>Registrer deltager</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Startnummer" name="startnummer" value={form.startnummer} onChange={handleChange} fullWidth margin="normal" required disabled={saving} error={!!errors.startnummer} helperText={errors.startnummer} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} />
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
          <Button type="submit" variant="contained" color="primary" disabled={saving || !!errors.email || !!errors.telefon || !!errors.startnummer}>
            {saving ? 'Lagrer...' : 'Registrer'}
          </Button>
        </Box>
      </form>

      {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
      {registeredMessage && <Typography color="success.main" mt={2}>{registeredMessage}</Typography>}
    </Box>
  );
};

export default Registration;