import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

import { Deltager, DeltagerStatus,EtappeResultat, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';

const Results: React.FC = () => {
  const { deltagere, editDeltager } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const numEtapper = etapper.length;

  // Debug output: log deltagere context data
  React.useEffect(() => {
    console.log('DEBUG: deltagere context', JSON.stringify(deltagere, null, 2));
  }, [deltagere]);

  // Grupper deltagere per klasse
  const grupper: { [klasse: string]: typeof deltagere } = {};
  const safeDeltagere = Array.isArray(deltagere) ? deltagere : [];
  safeDeltagere.forEach((d) => {
    if (!grupper[d.klasse]) grupper[d.klasse] = [];
    grupper[d.klasse].push(d);
  });

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editNavn, setEditNavn] = useState<string | null>(null);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editInfo, setEditInfo] = useState<Partial<Deltager>>({});
  const [editResultater, setEditResultater] = useState<EtappeResultat[]>([]);

  const handleEdit = (d: Deltager) => {
    // blur any focused element before opening dialog so it's not hidden by aria-hidden
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setEditNavn(d.navn);
    setEditResultater(
      Array.from({ length: numEtapper }, (_, i) =>
        d.resultater?.[i] || { etappe: i + 1, starttid: '', sluttTid: '', idealtid: '', diff: '', status: 'NONE' as DeltagerStatus }
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
    setEditInfo((prev: Partial<Deltager>) => ({ ...prev, [field]: value }));
  };

  const handleResultatStatusChange = (etappeIdx: number, status: string) => {
    setEditResultater(prev => prev.map((r, i) => i === etappeIdx ? { ...r, status: status as DeltagerStatus } : r));
  };

  const handleEditInfoSave = () => {
    if (editNavn && editInfo) editDeltager(editNavn, editInfo);
    setEditInfoOpen(false);
  };

  const handleEditSave = () => {
    if (editNavn && editResultater) editDeltager(editNavn, { resultater: editResultater });
    setOpen(false);
  };

  const safeEtapper = Array.isArray(etapper) ? etapper : [];

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>Resultatliste</Typography>
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
                  <TableCell>Start-tid</TableCell>
                  {Array.from({ length: numEtapper }, (_, i) => (
                    <TableCell key={i}>{safeEtapper[i]?.navn ? `${safeEtapper[i].navn}` : `Etappe ${i + 1} tid`}</TableCell>
                  ))}
                  <TableCell>Handling</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((d, idx) => {
                  // Normalize resultater array to always have numEtapper entries
                  const normalizedResultater = Array.from({ length: numEtapper }, (_, i) => {
                    const found = d.resultater?.find(r => r.etappe === i + 1);
                    return found || { etappe: i + 1, starttid: '', sluttTid: '', idealtid: '', diff: '', status: 'NONE' as DeltagerStatus };
                  });
                  return (
                    <TableRow key={idx}>
                      <TableCell>{d.navn}</TableCell>
                      <TableCell>{d.sykkel}</TableCell>
                      <TableCell>{d.modell}</TableCell>
                      <TableCell>{d.starttid}</TableCell>
                      {normalizedResultater.map((r, i) => (
                        <TableCell key={i}>
                          {r.status === 'DNS' ? (
                            <span style={{ color: '#d32f2f', fontWeight: 600 }}>DNS</span>
                          ) : r.status === 'DNF' ? (
                            <span style={{ color: '#ed6c02', fontWeight: 600 }}>DNF</span>
                          ) : (
                            // Use canonical sluttTid
                            ((r as any).sluttTid || '')
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <IconButton onClick={() => handleEdit(d)} size="small"><EditIcon /></IconButton>
                        <IconButton onClick={() => handleEditInfo(d)} size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                        {/* delete moved to Startliste */}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          <TextField label="Start-tid" value={editInfo.starttid || ''} onChange={e => handleEditInfoChange('starttid', e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInfoOpen(false)}>Avbryt</Button>
          <Button onClick={handleEditInfoSave} variant="contained">Lagre</Button>
        </DialogActions>
      </Dialog>
      {/* Rediger resultater dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Rediger etapperesultater</DialogTitle>
        <DialogContent>
          {editResultater.map((r, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Etappe {r.etappe}</Typography>
              <TextField
                label="Start-tid"
                value={r.starttid || ''}
                onChange={e => setEditResultater(prev => prev.map((res, idx) => idx === i ? { ...res, starttid: e.target.value } : res))}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Slutt-tid"
                // Use canonical sluttTid
                value={(r as any).sluttTid || ''}
                onChange={e => setEditResultater(prev => prev.map((res, idx) => idx === i ? { ...res, sluttTid: e.target.value } : res))}
                fullWidth
                margin="dense"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={r.status || 'NONE'}
                  onChange={e => handleResultatStatusChange(i, e.target.value as string)}
                >
                  <MenuItem value="NONE">Ingen</MenuItem>
                  <MenuItem value="DNS">DNS</MenuItem>
                  <MenuItem value="DNF">DNF</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Avbryt</Button>
          <Button onClick={handleEditSave} variant="contained">Lagre</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Results;
