package com.factorygrid.iam.exception;

public class IamException extends RuntimeException {
    public IamException(String message) {
        super(message);
    }
    public IamException(String message, Throwable cause) {
        super(message, cause);
    }
}
