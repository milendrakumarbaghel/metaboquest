package org.springboot.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    private final String ingestKey, reviewKey;
    public ApiKeyAuthenticationFilter(Environment env){ingestKey=env.getProperty("PIPELINE_API_KEY","");reviewKey=env.getProperty("REVIEW_API_KEY","");}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String supplied=request.getHeader("X-API-Key");
        if(supplied!=null){
            List<SimpleGrantedAuthority> roles=new ArrayList<>();
            if(matches(supplied,ingestKey)) roles.add(new SimpleGrantedAuthority("ROLE_PIPELINE"));
            if(matches(supplied,reviewKey)) roles.add(new SimpleGrantedAuthority("ROLE_REVIEWER"));
            if(!roles.isEmpty()) SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("api-client",null,roles));
        }
        chain.doFilter(request,response);
    }
    private boolean matches(String supplied,String expected){return !expected.isBlank()&&MessageDigest.isEqual(supplied.getBytes(StandardCharsets.UTF_8),expected.getBytes(StandardCharsets.UTF_8));}
}
