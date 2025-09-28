import React, { useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Button, Stack } from '@mui/material';

function buildStartbekreftelseHTML(deltagere: any[], etapper: any[]) {
  const rows = deltagere.map(d => {
    return `
      <div style="page-break-inside: avoid; margin:20px; font-family: Arial, sans-serif;">
        <h2>Startbekreftelse - Novemberløpet 2025</h2>
        <p><b>Startnummer:</b> ${d.startnummer}</p>
        <p><b>Navn:</b> ${d.navn}</p>
        <p><b>Adresse/Poststed:</b> ${d.poststed || ''}</p>
        <p><b>E-mail/tlf:</b> ${d.email || ''} ${d.tlf || ''}</p>
        <p><b>Sykkel:</b> ${d.sykkel} (${d.modell})</p>
        <p><b>Klasse:</b> ${d.klasse}</p>
        <p><b>Starttid:</b> ${d.starttid}</p>
        <hr/>
        <p>Jeg deltar i løpet på eget ansvar, og vil ikke kreve erstatningsansvar mot arrangør eller grunneiere ved evt. skade. Jeg har ikke begrensninger på utøvelse av sport fra min lege.</p>
        <p>Dato: 2025-09-27</p>
        <p>Signatur: _________________________</p>
      </div>
    `;
  }).join('\n');

  const css = `
    <style>
      @media print { .no-print { display:none } }
      body { font-family: Arial, sans-serif; margin: 20px }
      h2 { margin-bottom: 8px }
    </style>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Startbekreftelser</title>${css}</head><body>${rows}</body></html>`;
}

const ParticipantsList: React.FC = () => {
  const { deltagere } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (startnummer: string) => {
    setSelected(prev => prev.includes(startnummer) ? prev.filter(s => s !== startnummer) : [...prev, startnummer]);
  };
  const selectAll = () => setSelected(deltagere.map(d => d.startnummer));
  const clearAll = () => setSelected([]);

  const handlePrint = () => {
    const chosen = deltagere.filter(d => selected.includes(d.startnummer));
    if (chosen.length === 0) return alert('Velg én eller flere deltagere først');
    const html = buildStartbekreftelseHTML(chosen, etapper);
    const w = window.open('', '_blank');
    if (!w) return alert('Kunne ikke åpne nytt vindu. Sjekk popup-blokkering.');
    w.document.write(html);
    w.document.close();
    w.focus();
    // Give browser a moment to render
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>Deltagere</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button variant="outlined" size="small" onClick={selectAll}>Velg alle</Button>
        <Button variant="outlined" size="small" onClick={clearAll}>Fjern valg</Button>
        <Button variant="contained" size="small" onClick={handlePrint} disabled={selected.length===0}>Vis / Skriv ut startbekreftelse</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nr</TableCell>
              <TableCell>Navn</TableCell>
              <TableCell>Klasse</TableCell>
              <TableCell>Sykkel</TableCell>
              <TableCell>Starttid</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deltagere.map((d) => (
              <TableRow key={d.startnummer} hover>
                <TableCell padding="checkbox"><Checkbox checked={selected.includes(d.startnummer)} onChange={() => toggle(d.startnummer)} /></TableCell>
                <TableCell>{d.startnummer}</TableCell>
                <TableCell>{d.navn}</TableCell>
                <TableCell>{d.klasse}</TableCell>
                <TableCell>{d.sykkel}</TableCell>
                <TableCell>{d.starttid}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParticipantsList;
