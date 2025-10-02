import {
  Box,
  Button,
  MenuItem,
  TextField
} from '@mui/material';
import React, { useEffect, useRef,useState } from 'react';

import { useDeltagerContext } from '../context/DeltagerContext';
import DeltagerPrintView from './DeltagerPrintView'; // juster path etter behov

const Confirmation: React.FC = () => {
  const { deltagere, confirmSelectedStartnummer, setConfirmSelection } = useDeltagerContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectRef = useRef<HTMLInputElement | null>(null);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const deltager = selectedIdx !== null ? deltagere[selectedIdx] : null;

  // If another page requested a preselection, apply it here and then clear the request
  useEffect(() => {
    if (confirmSelectedStartnummer == null) return;
    let target: string | null = null;
    if (Array.isArray(confirmSelectedStartnummer)) {
      if (confirmSelectedStartnummer.length === 0) return;
      target = String(confirmSelectedStartnummer[0]);
    } else {
      target = String(confirmSelectedStartnummer);
    }
    const idx = deltagere.findIndex(d => d.startnummer === target);
    if (idx >= 0) setSelectedIdx(idx);
    // clear the selection request so it won't reapply
    try { if (typeof setConfirmSelection === 'function') setConfirmSelection(null); } catch (e) {}
  }, [confirmSelectedStartnummer, deltagere, setConfirmSelection]);

  // When selectedIdx changes (i.e. preselection applied), focus the select and scroll the printable area into view
  useEffect(() => {
    if (selectedIdx === null) return;
    // Focus the select input so keyboard focus is visible to the user
    try {
      if (selectRef.current && typeof (selectRef.current as any).focus === 'function') {
        (selectRef.current as any).focus();
      }
    } catch (e) { /* ignore */ }

    // Scroll printable area into view shortly after render
    setTimeout(() => {
      try {
        const el = printableRef.current;
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (e) { /* ignore */ }
    }, 120);
  }, [selectedIdx]);

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
          inputRef={selectRef}
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
        <div ref={printableRef}>
          <DeltagerPrintView deltager={deltager} />
        </div>
      )}
    </Box>
  );
};

export default Confirmation;