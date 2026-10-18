package org.springboot.backend.common;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.time.Instant;
import java.util.Map;
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e,HttpServletRequest request){return ResponseEntity.status(e.status()).body(body(e.status(),e.getMessage(),request));}
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e,HttpServletRequest request){String message=e.getBindingResult().getFieldErrors().stream().findFirst().map(f->f.getField()+" "+f.getDefaultMessage()).orElse("Invalid request");return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST,message,request));}
    @ExceptionHandler(MaxUploadSizeExceededException.class) ResponseEntity<?> large(MaxUploadSizeExceededException e,HttpServletRequest request){return ResponseEntity.status(413).body(body(HttpStatus.PAYLOAD_TOO_LARGE,"PDF exceeds the configured upload limit",request));}
    private Map<String,Object> body(HttpStatus status,String message,HttpServletRequest request){return Map.of("timestamp",Instant.now().toString(),"status",status.value(),"error",status.getReasonPhrase(),"message",message,"path",request.getRequestURI());}
}
