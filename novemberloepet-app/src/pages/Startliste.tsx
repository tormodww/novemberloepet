import React, { useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';

// Felter som kan sorteres på
const sortableFields = [
  { id: 'startnummer', label: 'Nr' },
  { id: 'navn', label: 'Navn' },
  { id: 'klasse', label: 'Klasse' },
  { id: 'sykkel', label: 'Sykkel' },
  { id: 'starttid', label: 'Starttid' },
] as const;
type SortField = typeof sortableFields[number]['id'];

type SortOrder = 'asc' | 'desc';

const Startliste: React.FC = () => {
  const { deltagere } = useDeltagerContext();
  const [sortField, setSortField] = useState<SortField>('startnummer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sorted = [...deltagere].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    // Numerisk sortering for startnummer
    if (sortField === 'startnummer') {
      aVal = parseInt(aVal as string, 10);
      bVal = parseInt(bVal as string, 10);
      if (isNaN(aVal as number) || isNaN(bVal as number)) return 0;
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    }
    // Ellers tekstsortering
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, 'nb')
        : bVal.localeCompare(aVal, 'nb');
    }
    return 0;
  });

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>Startliste</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {sortableFields.map(col => (
                <TableCell key={col.id} sortDirection={sortField === col.id ? sortOrder : false}>
                  <TableSortLabel
                    active={sortField === col.id}
                    direction={sortField === col.id ? sortOrder : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((d) => (
              <TableRow key={d.startnummer} hover>
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

export default Startliste;