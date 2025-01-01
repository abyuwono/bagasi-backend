import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Paper,
  Typography,
  Chip,
  Popper,
  CircularProgress,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  History,
  Clear
} from '@mui/icons-material';
import { debounce } from 'lodash';
import api from '../../services/api';

interface SearchSuggestions {
  ads: string[];
  users: string[];
}

interface PopularSearches {
  products: string[];
  destinations: string[];
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search for products, destinations, or users...',
  autoFocus = false
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    ads: [],
    users: []
  });
  const [popularSearches, setPopularSearches] = useState<PopularSearches>({
    products: [],
    destinations: []
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPopularSearches();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (query) {
      debouncedFetchSuggestions(query);
    }
  }, [query]);

  const debouncedFetchSuggestions = debounce(async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await api.get('/api/search/suggestions', {
        params: { query: searchQuery }
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const fetchPopularSearches = async () => {
    try {
      const response = await api.get('/api/search/popular');
      setPopularSearches(response.data);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    const recent = new Set([searchQuery, ...recentSearches]);
    const updatedRecent = Array.from(recent).slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    setRecentSearches(updatedRecent);
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      onSearch(searchQuery.trim());
      setOpen(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleClearRecent = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  return (
    <Box ref={searchRef} sx={{ width: '100%', position: 'relative' }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyPress={handleKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: loading && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />

      <Popper
        open={open}
        anchorEl={searchRef.current}
        placement="bottom-start"
        style={{
          width: searchRef.current?.clientWidth,
          zIndex: theme.zIndex.modal
        }}
      >
        <Paper
          elevation={3}
          sx={{
            mt: 1,
            p: 2,
            maxHeight: 400,
            overflow: 'auto'
          }}
        >
          {/* Suggestions */}
          {query && suggestions.ads.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Suggestions
              </Typography>
              {suggestions.ads.map((suggestion, index) => (
                <Box
                  key={index}
                  sx={{
                    py: 0.5,
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                  onClick={() => handleSearch(suggestion)}
                >
                  <Typography>{suggestion}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <Box mb={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Recent Searches
                </Typography>
                <IconButton size="small" onClick={handleClearRecent}>
                  <Clear fontSize="small" />
                </IconButton>
              </Box>
              {recentSearches.map((search, index) => (
                <Chip
                  key={index}
                  label={search}
                  onClick={() => handleSearch(search)}
                  onDelete={() => {
                    const updated = recentSearches.filter((_, i) => i !== index);
                    setRecentSearches(updated);
                    localStorage.setItem(
                      'recentSearches',
                      JSON.stringify(updated)
                    );
                  }}
                  icon={<History />}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}

          {/* Popular Searches */}
          {!query && (
            <>
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Popular Products
                </Typography>
                {popularSearches.products.map((product, index) => (
                  <Chip
                    key={index}
                    label={product}
                    onClick={() => handleSearch(product)}
                    icon={<TrendingUp />}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Popular Destinations
                </Typography>
                {popularSearches.destinations.map((destination, index) => (
                  <Chip
                    key={index}
                    label={destination}
                    onClick={() => handleSearch(destination)}
                    icon={<TrendingUp />}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </>
          )}
        </Paper>
      </Popper>
    </Box>
  );
};

export default SearchBar;
