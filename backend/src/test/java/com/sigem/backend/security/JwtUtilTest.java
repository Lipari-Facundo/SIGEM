package com.sigem.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    @Test
    void signsAndValidatesHs384TokensWithConfiguredSecret() {
        JwtUtil jwtUtil = new JwtUtil(secret(48, (byte) 1));
        var user = User.withUsername("enfermero").password("unused").authorities("ROLE_ENF").build();
        String token = jwtUtil.generateToken(user);

        assertTrue(jwtUtil.validateToken(token, user));
        assertFalse(jwtUtil.validateToken(token,
                User.withUsername("otro").password("unused").authorities("ROLE_ENF").build()));
        assertThrows(RuntimeException.class,
                () -> new JwtUtil(secret(48, (byte) 2)).validateToken(token, user));
    }

    @Test
    void rejectsMalformedOrWeakSecretsAtInitialization() {
        assertThrows(IllegalStateException.class, () -> new JwtUtil("not-base64"));
        assertThrows(IllegalStateException.class, () -> new JwtUtil(secret(47, (byte) 1)));
        assertThrows(IllegalStateException.class, () -> new JwtUtil(secret(64, (byte) 1)));
    }

    private String secret(int length, byte value) {
        byte[] bytes = new byte[length];
        java.util.Arrays.fill(bytes, value);
        return Base64.getEncoder().encodeToString(bytes);
    }
}
