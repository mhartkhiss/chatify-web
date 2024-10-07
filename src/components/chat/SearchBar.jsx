import React, { useState, useEffect } from 'react';
import { InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  // Debounce mechanism to delay search calls
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300); // 300ms delay

    // Cleanup timeout if user is still typing
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <Paper
      component="form"
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '5px',
        backgroundColor: '#e8e8e8',
        boxShadow: 'none',
      }}
    >
      <SearchIcon sx={{ color: '#888' }} />
      <InputBase
        placeholder="Find or start a chat"
        sx={{ ml: 1, flex: 1, color: '#333' }}
        inputProps={{ 'aria-label': 'search messages or users' }}
        value={query}
        onChange={handleSearchChange}
      />
    </Paper>
  );
};

export default SearchBar;
