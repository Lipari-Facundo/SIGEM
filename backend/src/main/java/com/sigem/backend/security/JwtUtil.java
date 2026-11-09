package com.sigem.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {
    private final SecretKey signingKey;

    // Duración del token: 8 horas (en milisegundos)
    private static final long EXPIRATION = 1000 * 60 * 60 * 8;

    public JwtUtil(@Value("${sigem.jwt.secret-base64}") String secretBase64) {
        byte[] secret;
        try {
            secret = Decoders.BASE64.decode(secretBase64);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("SIGEM_JWT_SECRET_BASE64 debe ser una clave Base64 válida", exception);
        }
        if (secret.length < 48 || secret.length >= 64) {
            throw new IllegalStateException(
                    "SIGEM_JWT_SECRET_BASE64 debe codificar entre 48 y 63 bytes para HS384");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret);
    }

    // Genera un token JWT para el usuario dado
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(signingKey, Jwts.SIG.HS384)
                .compact();
    }

    // Extrae el username del token
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Verifica que el token sea válido y pertenezca al usuario
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}