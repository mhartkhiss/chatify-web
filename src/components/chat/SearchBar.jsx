import React, { useState } from 'react';
import { InputBase, Box, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // Pass the search query back to the parent
  };

  return (
    <Paper component="form" sx={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
      <SearchIcon />
      <InputBase
        placeholder="Search messages or users"
        sx={{ ml: 1, flex: 1 }}
        inputProps={{ 'aria-label': 'search messages or users' }}
        value={query}
        onChange={handleSearchChange} // Update the query when the input changes
      />
    </Paper>
  );
};

export default SearchBar;
