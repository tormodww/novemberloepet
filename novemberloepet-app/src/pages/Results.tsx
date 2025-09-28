import React, { useState } from 'react';
import { useDeltagerContext, Deltager, EtappeResultat } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const ETAPPER = 5; // Antall etapper, kan endres etter behov

const Results: React.FC = () => {
  const { deltagere, updateResultater, addDeltager, editDeltager } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  // Grupper deltagere per klasse
  const grupper: { [klasse: string]: typeof deltagere } = {};
  deltagere.forEach((d) => {
    if (!grupper[d.klasse]) grupper[d.klasse] = [];
    grupper[d.klasse].push(d);
  });

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editNavn, setEditNavn] = useState<string | null>(null);
  const [resultater, setResultater] = useState<EtappeResultat[]>([]);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editInfo, setEditInfo] = useState<Partial<Deltager>>({});

  const handleEdit = (d: Deltager) => {
    // blur any focused element before opening dialog so it's not hidden by aria-hidden
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setEditNavn(d.navn);
    setResultater(
      Array.from({ length: ETAPPER }, (_, i) =>
        d.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }
      )
    );
    setOpen(true);
  };

  const handleEditInfo = (d: Deltager) => {
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setEditNavn(d.navn);
    setEditInfo(d);
    setEditInfoOpen(true);
  };

  const handleEditInfoChange = (field: keyof Deltager, value: string) => {
    setEditInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInfoSave = () => {
    if (editNavn && editInfo) editDeltager(editNavn, editInfo);
    setEditInfoOpen(false);
  };

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>Resultatliste (demo)</Typography>
      {Object.keys(grupper).length === 0 && <Typography>Ingen deltagere registrert.</Typography>}
      {Object.entries(grupper).map(([klasse, list]) => (
        <Box key={klasse} mt={4}>
          <Typography variant="h6" gutterBottom>{klasse}</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Navn</TableCell>
                  <TableCell>Sykkel</TableCell>
                  <TableCell>Modell</TableCell>
                  <TableCell>Starttid</TableCell>
                  {Array.from({ length: ETAPPER }, (_, i) => (
                    <TableCell key={i}>{etapper[i]?.navn ? `${etapper[i].navn}` : `Etappe ${i + 1} tid`}</TableCell>
                  ))}
                  <TableCell>Handling</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{d.navn}</TableCell>
                    <TableCell>{d.sykkel}</TableCell>
                    <TableCell>{d.modell}</TableCell>
                    <TableCell>{d.starttid}</TableCell>
                    {Array.from({ length: ETAPPER }, (_, i) => (
                      <TableCell key={i}>{d.resultater?.[i]?.maltid || ''}</TableCell>
                    ))}
                    <TableCell>
                      <IconButton onClick={() => handleEdit(d)} size="small"><EditIcon /></IconButton>
                      <IconButton onClick={() => handleEditInfo(d)} size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                      {/* delete moved to Startliste */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
      {/* Rediger deltager info dialog */}
      <Dialog open={editInfoOpen} onClose={() => setEditInfoOpen(false)}>
        <DialogTitle>Rediger deltagerinfo</DialogTitle>
        <DialogContent>
          <TextField label="Navn" value={editInfo.navn || ''} onChange={e => handleEditInfoChange('navn', e.target.value)} fullWidth margin="dense" />
          <TextField label="Nasjon" value={editInfo.nasjon || ''} onChange={e => handleEditInfoChange('nasjon', e.target.value)} fullWidth margin="dense" />
          <TextField label="Poststed" value={editInfo.poststed || ''} onChange={e => handleEditInfoChange('poststed', e.target.value)} fullWidth margin="dense" />
          <TextField label="Sykkel" value={editInfo.sykkel || ''} onChange={e => handleEditInfoChange('sykkel', e.target.value)} fullWidth margin="dense" />
          <TextField label="Modell" value={editInfo.modell || ''} onChange={e => handleEditInfoChange('modell', e.target.value)} fullWidth margin="dense" />
          <TextField label="Klasse" value={editInfo.klasse || ''} onChange={e => handleEditInfoChange('klasse', e.target.value)} fullWidth margin="dense" />
          <TextField label="Starttid" value={editInfo.starttid || ''} onChange={e => handleEditInfoChange('starttid', e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInfoOpen(false)}>Avbryt</Button>
          <Button onClick={handleEditInfoSave} variant="contained">Lagre</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Results;