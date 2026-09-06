package com.fastorder.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;
import android.text.style.StyleSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.webkit.WebView;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private View splashOverlay;
    private final Handler splashHandler = new Handler(Looper.getMainLooper());
    private Runnable dismissRunnable;
    private boolean isDismissed = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupAnimatedSplash();

        // Modern Android back navigation: history back inside WebView
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = (getBridge() != null) ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void setupAnimatedSplash() {
        ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
        LayoutInflater inflater = LayoutInflater.from(this);
        splashOverlay = inflater.inflate(R.layout.splash_overlay, decorView, false);
        decorView.addView(splashOverlay);

        ImageView logo = splashOverlay.findViewById(R.id.splash_logo);
        TextView title = splashOverlay.findViewById(R.id.splash_title);
        TextView tagline = splashOverlay.findViewById(R.id.splash_tagline);
        View glow = splashOverlay.findViewById(R.id.splash_ambient_glow);

        // Format brand title: "FAST" in orange (#FFA41C), "order" in white (#FFFBF5)
        SpannableStringBuilder ssb = new SpannableStringBuilder("FASTorder");
        ssb.setSpan(new ForegroundColorSpan(Color.parseColor("#FFA41C")), 0, 4, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        ssb.setSpan(new ForegroundColorSpan(Color.parseColor("#FFFBF5")), 4, 9, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        ssb.setSpan(new StyleSpan(Typeface.BOLD), 0, 9, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        title.setText(ssb);

        // Initial animation state
        logo.setAlpha(0f);
        logo.setScaleX(0.85f);
        logo.setScaleY(0.85f);

        title.setAlpha(0f);
        title.setTranslationY(40f);

        tagline.setAlpha(0f);
        tagline.setTranslationY(30f);

        glow.setAlpha(0f);
        glow.setScaleX(0.8f);
        glow.setScaleY(0.8f);

        // Logo scale-up and fade-in
        logo.animate()
            .alpha(1f)
            .scaleX(1.0f)
            .scaleY(1.0f)
            .setDuration(600)
            .setInterpolator(new DecelerateInterpolator(1.8f))
            .start();

        // Ambient glow pulse
        glow.animate()
            .alpha(0.5f)
            .scaleX(1.1f)
            .scaleY(1.1f)
            .setDuration(800)
            .setInterpolator(new DecelerateInterpolator())
            .start();

        // Title upward slide and fade-in at 300ms
        title.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(300)
            .setDuration(500)
            .setInterpolator(new DecelerateInterpolator())
            .start();

        // Tagline upward slide and fade-in at 450ms
        tagline.animate()
            .alpha(0.85f)
            .translationY(0f)
            .setStartDelay(450)
            .setDuration(500)
            .setInterpolator(new DecelerateInterpolator())
            .start();

        // Automatic dismiss transition at 1700ms (total ~2s including fade out)
        dismissRunnable = this::dismissSplash;
        splashHandler.postDelayed(dismissRunnable, 1700);

        // Tap to dismiss immediately
        splashOverlay.setOnClickListener(v -> dismissSplash());
    }

    private void dismissSplash() {
        if (isDismissed || splashOverlay == null) return;
        isDismissed = true;

        splashOverlay.animate()
            .alpha(0f)
            .setDuration(350)
            .setInterpolator(new AccelerateDecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (splashOverlay != null && splashOverlay.getParent() != null) {
                        ((ViewGroup) splashOverlay.getParent()).removeView(splashOverlay);
                        splashOverlay = null;
                    }
                }
            })
            .start();
    }

    @Override
    public void onDestroy() {
        if (dismissRunnable != null) {
            splashHandler.removeCallbacks(dismissRunnable);
        }
        super.onDestroy();
    }
}
