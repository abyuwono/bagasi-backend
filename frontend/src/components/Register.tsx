import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { auth } from '../services/api';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  whatsappNumber: string;
  role: 'traveler' | 'shopper';
}

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNumber: '',
    role: 'traveler',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      whatsappNumber: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password dan konfirmasi password tidak cocok',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await auth.register({
        email: formData.email,
        password: formData.password,
        whatsappNumber: formData.whatsappNumber,
        role: formData.role,
      });

      toast({
        title: 'Sukses',
        description: 'Pendaftaran berhasil! Silakan login.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Terjadi kesalahan saat mendaftar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Daftar Akun Baru
        </Text>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan alamat email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan password"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Konfirmasi Password</FormLabel>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Masukkan ulang password"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Nomor WhatsApp</FormLabel>
              <PhoneInput
                country="id"
                value={formData.whatsappNumber}
                onChange={handlePhoneChange}
                inputStyle={{
                  width: '100%',
                  height: '40px',
                  fontSize: '16px',
                  paddingLeft: '48px',
                }}
                buttonStyle={{
                  borderRadius: '0.375rem 0 0 0.375rem',
                }}
                containerStyle={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                placeholder="81234567890"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Daftar Sebagai</FormLabel>
              <RadioGroup
                name="role"
                value={formData.role}
                onChange={(value: 'traveler' | 'shopper') => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <Stack direction="row" spacing={4}>
                  <Radio value="traveler">Traveler</Radio>
                  <Radio value="shopper">Shopper</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              mt={4}
              isLoading={loading}
            >
              Daftar
            </Button>

            <Text textAlign="center">
              Sudah punya akun?{' '}
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => navigate('/login')}
              >
                Login di sini
              </Button>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Register;
