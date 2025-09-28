import React, { useState } from 'react';
import { TextField, Button, Box, MenuItem, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useDeltagerContext, Deltager } from '../context/DeltagerContext';

const classes = [
  'Oldtimer',
  'Pre 75',
  'Pre 85',
  'Pre 90',
  'Offroad 2000',
  'Super-EVO',
];

const initialState: Deltager = {
  startnummer: '',
  navn: '',
  nasjon: '',
  poststed: '',
  sykkel: '',
  modell: '',
  klasse: '',
  starttid: '',
  resultater: [],
};

const Registration: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const { deltagere, addDeltager } = useDeltagerContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDeltager(form);
    setForm(initialState);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Box maxWidth={500} mx="auto">
      <Typography variant="h5" gutterBottom>Registrer deltager</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Startnummer" name="startnummer" value={form.startnummer} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Navn" name="navn" value={form.navn} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Nasjon" name="nasjon" value={form.nasjon} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Poststed" name="poststed" value={form.poststed} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Sykkel" name="sykkel" value={form.sykkel} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Modell (år)" name="modell" value={form.modell} onChange={handleChange} fullWidth margin="normal" />
        <TextField select label="Klasse" name="klasse" value={form.klasse} onChange={handleChange} fullWidth margin="normal" required>
          {classes.map((cls) => (
            <MenuItem key={cls} value={cls}>{cls}</MenuItem>
          ))}
        </TextField>
        <TextField label="Starttid" name="starttid" value={form.starttid} onChange={handleChange} fullWidth margin="normal" />
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary">Registrer</Button>
        </Box>
      </form>
      {submitted && <Typography color="success.main" mt={2}>Deltager registrert!</Typography>}
      {deltagere.length > 0 && (
        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6">Registrerte deltagere</Typography>
          <List>
            {deltagere.map((d, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={`#${d.startnummer} ${d.navn}`} secondary={`${d.klasse} | ${d.sykkel} | ${d.starttid}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Registration;