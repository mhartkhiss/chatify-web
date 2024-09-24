import React from 'react';
import { InputBase, Box, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = () => {
  return (
    <Paper component="form" sx={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
      <SearchIcon />
      <InputBase
        placeholder="Search messages or users"
        sx={{ ml: 1, flex: 1 }}
        inputProps={{ 'aria-label': 'search messages or users' }}
      />
    </Paper>
  );
};

export default SearchBar;
