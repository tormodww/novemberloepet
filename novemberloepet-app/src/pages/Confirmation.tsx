import React, { useRef, useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import {
  Box,
  Button,
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
  const deltager = selectedIdx !== null ? deltagere[selectedIdx] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box maxWidth={800} mx="auto" p={4}>
      {/* Ikke med i utskrift */}
      <Box className="no-print" sx={{
        position: 'sticky',
        top: { xs: '56px', sm: '64px' },
        background: 'background.paper',
        zIndex: 1200,
        pt: 1,
        pb: 1,
        mb: 2,
        boxShadow: 1
      }}>
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

      <Box className="no-print" mb={2}>
        <Button variant="contained" onClick={handlePrint} disabled={!deltager}>
          Print
        </Button>
      </Box>

      {/* Alt som skal med i utskrift */}
      <div>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box flex={1}>
            <Typography fontSize="1.4rem" fontWeight="bold" gutterBottom sx={{ whiteSpace: 'nowrap' }}>
              Startbekreftelse Novemberløpet 2025
            </Typography>
            <Typography variant="h6" gutterBottom>
              Lørdag 27. september kl. 10:30
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              Startnummer {deltager?.startnummer ?? ''}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              <strong>Navn:</strong> {deltager?.navn ?? ''}
            </Typography>
          </Box>

          <Box display="flex" gap={1} ml={3}>
            <img src="/page1_img1.png" alt="Logo 1" style={{ width: '80px', height: '60px', objectFit: 'contain' }} />
            <img src="/page1_img2.png" alt="Logo 2" style={{ width: '80px', height: '60px', objectFit: 'contain' }} />
            <img src="/page1_img3.jpeg" alt="Logo 3" style={{ width: '80px', height: '60px', objectFit: 'contain' }} />
          </Box>
        </Box>

        {deltager && (
          <Box mt={3}>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small" aria-label="deltager-compact">
                <TableBody>
                  {[
                    ['Navn', deltager.navn || '-', 'Fødselsår', (deltager as any).fodselsaar ?? '0'],
                    ['Adresse', deltager.adresse || '-', 'Postnummer', deltager.postnr || '0'],
                    ['Poststed', deltager.poststed || '-', 'tlf', deltager.telefon || '-'],
                    ['E‑Mail', (deltager as any).email || (deltager as any).epost || '-', 'Sykkel', deltager.sykkel || '-'],
                    ['Modell', deltager.modell || (deltager as any).mod || '-', 'Antall løp', '-'],
                    ['Teknisk alder', deltager.teknisk || (deltager as any).tekniskAar || '-', 'Klasse', deltager.klasse || (deltager as any).preKlasse || '-'],
                    ['Fremmøte', 'Kl. 09:00', 'Maskinkontroll', 'Stikkprøver kl. 09:00–10:30'],
                    ['Parc Ferme', 'Kl. 10:00', 'Føremøte', 'Kl. 10:00'],
                    ['Første start', 'Kl. 10:30', 'Egen starttid', `Kl. ${deltager.starttid || '-'}`],
                  ].map(([l1, v1, l2, v2]) => (
                    <TableRow key={`${l1}-${l2}`}>
                      <TableCell sx={{ width: '25%' }}>{l1}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>{v1}</TableCell>
                      <TableCell sx={{ width: '25%' }}>{l2}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '30%' }}>{v2}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" fontWeight="bold" mb={2}>
              NB Husk enkeltmannspakke og ryggskinne
            </Typography>

            <Box mb={2}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="info-table">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: '30%' }}>INFO telefon</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Olav Dalåsen</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>0047 481 85 918</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overnatting</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>utgår</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>utgår</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Løpsreglement</TableCell>
                      <TableCell colSpan={2}>
                        <Typography fontWeight="bold">http://www.nvmc.no</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>


            <Typography variant="body2" textAlign="center" fontWeight="bold" mb={1}>
              Finnes under lokalavdelinger. / Motorsport (Den deles også ut i løpssekretariatet)
            </Typography>

            <Typography variant="body2" paragraph>
              Jeg deltar i løpet på eget ansvar, og vil ikke kreve erstatningsansvar mot arrangør eller grunneiere ved
              evt. skade. Jeg har ikke begrensninger på utøvelse av sport fra min lege
            </Typography>

            <Box mb={3}>
              <TableContainer>
                <Table size="small" aria-label="dato-tabell">
                  <TableBody>
                    {/* Tom linje først */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ height: '20px', border: 'none' }} />
                    </TableRow>

                    {/* Tre kolonner med delt innhold */}
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', border: 'none' }}>
                        Dato 27.09.2025
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', border: 'none' }}>
                        Moss mc
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', border: 'none' }}>
                        Moss
                      </TableCell>
                    </TableRow>

                    {/* Ekstra tom linje etterpå */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ height: '20px', border: 'none' }} />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>



            <Box borderTop={2} borderColor="black" pt={2} mb={3}>
              <Typography textAlign="center" fontWeight="bold" fontSize="1.1rem" mb={0.5}>
                {deltager.navn}
              </Typography>
              <Typography textAlign="center" fontWeight="bold" variant="body2" mb={1}>
                Deltagers underskrift
              </Typography>
              <Typography textAlign="center" variant="body2" mb={3}>
                Erklæringen leveres løpskontoret før start.
              </Typography>

              <Typography variant="body2" textAlign="center" fontWeight="bold" mb={0.5}>
                NVMC Motorsport ønsker alle hjertelig velkommen til arrangementet.
              </Typography>
              <Typography variant="body2" color="error" textAlign="center" fontWeight="bold">
                NB !!!! Vi henstiller til alle å ta med miljømatte
              </Typography>
            </Box>
          </Box>
        )}
      </div>
    </Box>
  );
};

export default Confirmation;
