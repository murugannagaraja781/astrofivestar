package com.astro5star.app.network;

import com.astro5star.app.model.LoginResponse;
import com.astro5star.app.model.OtpVerifyRequest;
import com.astro5star.app.model.PhoneLoginRequest;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface ApiService {
    @POST("api/send-otp")
    Call<LoginResponse> sendOtp(@Body PhoneLoginRequest request);

    @POST("api/verify-otp")
    Call<LoginResponse> verifyOtp(@Body OtpVerifyRequest request);

    @retrofit2.http.GET("api/astrologers")
    Call<com.astro5star.app.model.AstrologerListResponse> getAstrologers();
    // HomeActivity, but here we need a
    // shared class or trick.
    // Actually, declaring inner class in Interface is tricky. Let's create
    // `AstrologerListResponse.java` separately to be clean.
}
