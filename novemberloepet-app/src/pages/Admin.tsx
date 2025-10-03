import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FlagIcon from '@mui/icons-material/Flag';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createDeltagere } from '../api/deltagere';
import { useDeltagerContext } from '../context/DeltagerContext';
import { parseCsv } from '../utils/csv';

const adminActions = [
  {
    title: 'Startliste',
    description: 'Se komplett startliste og deltagerinformasjon',
    icon: <FormatListNumberedIcon sx={{ fontSize: 40 }} />,
    path: '/startliste',
    color: 'info' as const,
  },
  {
    title: 'Resultater',
    description: 'Se resultater og rangeringer',
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    path: '/results',
    color: 'success' as const,
  },
  {
    title: 'Etapper',
    description: 'Administrer etapper og idealtider',
    icon: <ListAltIcon sx={{ fontSize: 40 }} />,
    path: '/etapper',
    color: 'warning' as const,
  },
  {
    title: 'Registrering',
    description: 'Registrer nye deltagere',
    icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
    path: '/registration',
    color: 'primary' as const,
  },
  {
    title: 'Startbekreftelse',
    description: 'Se og administrer startbekreftelser',
    icon: <FlagIcon sx={{ fontSize: 40 }} />,
    path: '/confirmation',
    color: 'secondary' as const,
  },
  {
    title: 'Last ned data',
    description: 'Last ned deltager- og resultatdata',
    icon: <CloudDownloadIcon sx={{ fontSize: 40 }} />,
    path: '/download',
    color: 'secondary' as const,
  },
];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { deltagere, addDeltager } = useDeltagerContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setImporting(true);
    try {
      const text = await f.text();
      const rows = parseCsv(text);

      // determine starting startnummer (max existing + 1)
      const nums = deltagere.map(d => parseInt(String(d.startnummer) || '0', 10)).filter(n => !isNaN(n));
      let next = nums.length ? Math.max(...nums) + 1 : 1;

      const summary = { created: 0, failed: 0, skipped: 0 } as { created: number; failed: number; skipped: number };
      const used = new Set<string>(deltagere.map(d => String(d.startnummer)));
      const skippedLines: number[] = [];
      const failedLines: number[] = [];

      for (const rec of rows) {
        const rowLine = (rec as any).__line ?? undefined;
        const find = (names: string[]) => {
          for (const n of names) {
            const match = Object.keys(rec).find(k => k.trim().toLowerCase() === n.toLowerCase());
            if (match && (rec[match] ?? '') !== '') return rec[match];
          }
          return '';
        };

        const sanitize = (s: string) => (s ?? '').toString().replace(/\u00A0/g, ' ').trim();
        const navn = sanitize(find(['Navn', 'navn']));
        const adresse = sanitize(find(['Adresse', 'adresse']));
        const postnr = sanitize(find(['Postnr', 'postnr', 'PostNr']));
        const poststed = sanitize(find(['Poststed', 'poststed']));
        const nasjon = sanitize(find(['Nasjon', 'nasjon'])) || 'Norge';
        const telefon = sanitize(find(['Telefon', 'telefon']));
        const email = sanitize(find(['E-mail', 'E-mail', 'Email', 'email', 'E mail']));
        const sykkel = sanitize(find(['Sykkel', 'sykkel']));
        const mod = sanitize(find(['Mod', 'mod', 'Modell', 'modell']));
        const modell = mod || '';
        const teknisk = sanitize(find(['Teknisk', 'teknisk']));
        const preKlasse = sanitize(find(['Pre/Klasse', 'Pre/Klasse', 'PreKlasse', 'preKlasse', 'pre klasse']));
        const klasse = sanitize(find(['Klasse', 'klasse']));
        const starttid = sanitize(find(['Starttid', 'starttid']));

        const payload: any = {
          startnummer: String(next),
          navn: navn || '',
          adresse: adresse || '',
          postnr: postnr || '',
          poststed: poststed || '',
          nasjon: nasjon || '',
          telefon: telefon || '',
          email: email || '',
          sykkel: sykkel || '',
          mod: mod || undefined,
          modell: modell || '',
          teknisk: teknisk || '',
          preKlasse: preKlasse || '',
          klasse: klasse || '',
          starttid: starttid || '',
          resultater: [],
        };

        // skip rows without a name
        if (!payload.navn) {
          summary.skipped++;
          if (rowLine) skippedLines.push(rowLine);
          next++;
          continue;
        }

        // ensure unique startnummer
        while (used.has(String(next))) next++;
        payload.startnummer = String(next);
        used.add(String(next));

        try {
          const created = await createDeltagere(payload);
          const toAdd = { ...payload, parseId: (created && (created.objectId || created.id)) || undefined };
          addDeltager(toAdd as any);
          summary.created++;
        } catch (err) {
          // fallback: add locally even if API failed
          addDeltager(payload as any);
          summary.failed++;
          if (rowLine) failedLines.push(rowLine);
        }

        next++;
      }

      let msg = `Import ferdig. Opprettet: ${summary.created}, feil: ${summary.failed}, hoppet over: ${summary.skipped}`;
      if (skippedLines.length) msg += `\nHoppet over linjer: ${skippedLines.join(', ')}`;
      if (failedLines.length) msg += `\nFeilede linjer: ${failedLines.join(', ')}`;
      window.alert(msg);
    } catch (err: any) {
      window.alert(`Import feilet: ${err?.message || String(err)}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Adminside
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {adminActions.map((action) => (
          <Grid key={action.title}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Box mb={1}>{action.icon}</Box>
              <Typography variant="h6" gutterBottom>{action.title}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>{action.description}</Typography>
              <Button variant="contained" color={action.color} fullWidth onClick={() => navigate(action.path)} sx={{ mt: 2 }}>
                Gå til
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} textAlign="center">
        <Button variant="outlined" color="secondary" onClick={() => navigate('/')}>Tilbake til forsiden</Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            await handleFile(f ?? null);
          }}
        />

        <Button variant="contained" color="primary" onClick={() => fileInputRef.current?.click()} disabled={importing} sx={{ ml: 2 }}>
          {importing ? 'Importer...' : 'Import deltagere'}
        </Button>
      </Box>

      <Box mt={2} textAlign="center">
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          aria-label="Fjern all local storage"
        >
          Fjern all local storage
        </Button>
      </Box>
    </Container>
  );
};

export default Admin;
