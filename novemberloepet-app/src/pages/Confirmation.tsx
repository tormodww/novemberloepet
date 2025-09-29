import React, { useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import {
  Box,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

const Confirmation: React.FC = () => {
  const { deltagere } = useDeltagerContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [signaturDato, setSignaturDato] = useState<string>('');
  const deltager = selectedIdx !== null ? deltagere[selectedIdx] : null;

  return (
    <Box maxWidth={800} mx="auto" p={4}>
      {/* Sticky dropdown øverst for raskt valg av deltager (fester seg under AppBar ved scroll) */}
      <Box sx={{ position: 'sticky', top: { xs: '56px', sm: '64px' }, background: 'background.paper', zIndex: 1200, pt: 1, pb: 1, mb: 2, boxShadow: 1 }}>
        <TextField
          select
          label="Velg deltager"
          value={selectedIdx ?? ''}
          onChange={e => setSelectedIdx(Number(e.target.value))}
          fullWidth
          margin="normal"
          size="small"
        >
          {deltagere.map((d, idx) => (
            <MenuItem key={idx} value={idx}>{d.navn} ({d.klasse})</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Header med tittel og logoer på høyre side */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box flex={1}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Startbekreftelse Novemberløpet 2025
          </Typography>
          <Typography variant="h6" gutterBottom>
            Lørdag 27. september kl. 10:30
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            Startnummer {deltager?.startnummer ?? ''}
          </Typography>
          {/* Prominent navnlinje lik ønsket format */}
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            <strong>Navn:</strong> {deltager?.navn ?? ''}
          </Typography>
        </Box>

        {/* Logoer på høyre side */}
        <Box display="flex" gap={2} ml={3}>
          <img src="/page1_img1.png" alt="Logo 1" style={{ height: 80, width: 100, objectFit: 'contain' }} />
          <img src="/page1_img2.png" alt="Logo 2" style={{ height: 80, width: 100, objectFit: 'contain' }} />
          <img src="/page1_img3.jpeg" alt="Logo 3" style={{ height: 80, width: 100, objectFit: 'contain' }} />
        </Box>
      </Box>

      {deltager && (
        <Box mt={3}>
          {/* Kompakt tabell: to label/value-par per rad (4 kolonner) */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small" aria-label="deltager-compact">
              <TableBody>
                {[
                  // row: [label1, value1, label2, value2]
                  ['Navn', deltager.navn || '-', 'Fødselsår', (deltager as any).fodselsaar ?? '0'],
                  ['Adresse', deltager.adresse || '-', 'Postnummer', deltager.postnr || '0'],
                  ['Poststed', deltager.poststed || '-', 'tlf', deltager.telefon || '-'],
                  ['E‑Mail', (deltager as any).email || (deltager as any).epost || '-', 'Sykkel', deltager.sykkel || '-'],
                  ['Modell', deltager.modell || (deltager as any).mod || '-', 'Antall løp', '-'],
                  ['Teknisk alder', deltager.teknisk || (deltager as any).tekniskAar || '-', 'Klasse', deltager.klasse || (deltager as any).preKlasse || '-'],
                  // times rows
                  ['Fremmøte', 'Kl. 09:00', 'Maskinkontroll', 'Stikkprøver kl. 09:00–10:30'],
                  ['Parc Ferme', 'Kl. 10:00', 'Føremøte', 'Kl. 10:00'],
                  ['Første start', 'Kl. 10:30', 'Egen starttid', `Kl. ${deltager.starttid || '-'}`],
                ].map(([l1, v1, l2, v2]) => (
                  <TableRow key={`${l1}-${l2}`}>
                    <TableCell sx={{ width: '25%' }}>{l1}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>{v1}</TableCell>
                    <TableCell sx={{ width: '25%' }}>{l2}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>{v2}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" fontWeight="bold" mb={2}>
            NB Husk enkeltmannspakke og ryggskinne
          </Typography>

          {/* Kontaktinformasjon */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>INFO telefon</Typography>
              <Typography fontWeight="bold">Olav Dalåsen</Typography>
              <Typography fontWeight="bold">0047 481 85 918</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Overnatting</Typography>
              <Typography fontWeight="bold">utgår</Typography>
              <Typography fontWeight="bold">utgår</Typography>
            </Box>
            <Box display="flex" mb={0.5}>
              <Typography>Løpsreglement.</Typography>
              <Typography fontWeight="bold" ml={2}>http://www.nvmc.no</Typography>
            </Box>
          </Box>

          <Typography variant="body2" textAlign="center" fontWeight="bold" mb={1}>
            Finnes under lokalavdelinger. / Motorsport
          </Typography>
          <Typography variant="body2" textAlign="center" mb={2}>
            Deles også ut i løpssekretariatet
          </Typography>

          <Typography variant="body2" paragraph>
            Jeg deltar i løpet på eget ansvar, og vil ikke kreve erstatningsansvar mot arrangør eller grunneiere ved evt. skade. Jeg har ikke begrensninger på utøvelse av sport fra min lege
          </Typography>

          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={3} mb={3}> {/* Endret fra mb={1} til mb={3} */}
              <Typography variant="body2" fontWeight="bold"> </Typography>
            </Box>
          </Box>

          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={3} mb={3}> {/* Endret fra mb={1} til mb={3} */}
              <Typography variant="body2" fontWeight="bold">Dato</Typography>
              <Typography variant="body2">27.09.2025 Moss mc</Typography>
              <Typography variant="body2" fontWeight="bold">Moss</Typography>
            </Box>
          </Box>

          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={3} mb={3}> {/* Endret fra mb={1} til mb={3} */}
              <Typography variant="body2" fontWeight="bold"> </Typography>
            </Box>
          </Box>

          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={3} mb={3}> {/* Endret fra mb={1} til mb={3} */}
              <Typography variant="body2" fontWeight="bold"> </Typography>
            </Box>
          </Box>

          <Box borderTop={2} borderColor="black" pt={2} mb={3}>
            <Typography textAlign="center" fontWeight="bold" fontSize="1.1rem" mb={0.5}>
              {deltager.navn}
            </Typography>
            <Typography textAlign="center" fontWeight="bold" variant="body2" mb={1}>
              Deltagers underskrift
            </Typography>
            <Typography textAlign="center" variant="body2">
              Erklæringen leveres løpskontoret før start.
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              NVMC Motorsport ønsker alle hjertelig velkommen til arrangementet.
            </Typography>
            <Typography variant="body2" color="error" fontWeight="bold">
              NB !!!! Vi henstiller til alle å ta med miljømatte
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Confirmation;