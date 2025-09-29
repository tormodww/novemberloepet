import React, { useState, useEffect } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import {
  Box,
  Button,
  MenuItem,
  TextField
} from '@mui/material';
import DeltagerPrintView from './DeltagerPrintView'; // juster path etter behov

const Confirmation: React.FC = () => {
  const { deltagere } = useDeltagerContext();
  const { confirmSelectedStartnummer, setConfirmSelection } = useDeltagerContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const deltager = selectedIdx !== null ? deltagere[selectedIdx] : null;

  // If another page requested a preselection, apply it here and then clear the request
  useEffect(() => {
    if (!confirmSelectedStartnummer) return;
    const idx = deltagere.findIndex(d => d.startnummer === String(confirmSelectedStartnummer));
    if (idx >= 0) setSelectedIdx(idx);
    // clear the selection request so it won't reapply
    try { if (typeof setConfirmSelection === 'function') setConfirmSelection(null); } catch (e) {}
  }, [confirmSelectedStartnummer, deltagere, setConfirmSelection]);

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
      {deltager && (
        <DeltagerPrintView deltager={deltager} />
      )}
    </Box>
  );
};

export default Confirmation;