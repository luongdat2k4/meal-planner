package com.zl.pantrio.meal.plan.grocery;

import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Keeps an AppLovin MREC glued to the page while the page scrolls.
 *
 * The MREC is an Android view above the WebView, so it does not scroll with the page. Sending its position from JS on
 * every scroll frame reaches Android 50-65 ms after the page has moved, which looks like the ad is dragged on a string.
 * Instead JS sends the ad's position inside the page once, and this class moves the view in the frame that is being
 * drawn (onPreDraw), reading the same scroll value the page is drawn with.
 *
 * Only the document's scroll is visible to Android (WebView.getScrollY()); a scroll box inside the page is not.
 * So this works for screens that scroll on the document, and JS does not use it for the others.
 */
@CapacitorPlugin(name = "AdFollow")
public class AdFollowPlugin extends Plugin {
    private static final int MREC_HEIGHT_DP = 250;

    private static final class Target {
        float pageTop;
        float clipTop = -1;
        float clipBottom = -1;
        // True while this class has hidden the view because it is outside the allowed band.
        boolean hiddenByFollow;
    }

    private final Map<String, Target> targets = new HashMap<>();
    private ViewTreeObserver.OnPreDrawListener listener;

    @PluginMethod
    public void follow(final PluginCall call) {
        final String unit = call.getString("adUnitId");
        if (unit == null || unit.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }
        final double pageTop = call.getDouble("pageTop", 0d);
        final double clipTop = call.getDouble("clipTop", -1d);
        final double clipBottom = call.getDouble("clipBottom", -1d);
        getActivity().runOnUiThread(() -> {
            float d = density();
            Target target = targets.get(unit);
            if (target == null) {
                target = new Target();
                targets.put(unit, target);
            }
            target.pageTop = (float) (pageTop * d);
            target.clipTop = clipTop < 0 ? -1 : (float) (clipTop * d);
            target.clipBottom = clipBottom < 0 ? -1 : (float) (clipBottom * d);
            if (listener == null) {
                listener = () -> {
                    apply();
                    return true;
                };
                getBridge().getWebView().getViewTreeObserver().addOnPreDrawListener(listener);
            }
            apply();
            call.resolve();
        });
    }

    @PluginMethod
    public void unfollow(final PluginCall call) {
        final String unit = call.getString("adUnitId");
        getActivity().runOnUiThread(() -> {
            Target target = unit == null ? null : targets.remove(unit);
            if (target != null) {
                View view = find(unit);
                if (view != null) {
                    view.setTranslationY(0);
                    if (target.hiddenByFollow && view.getVisibility() == View.INVISIBLE) view.setVisibility(View.VISIBLE);
                }
            }
            if (targets.isEmpty() && listener != null) {
                getBridge().getWebView().getViewTreeObserver().removeOnPreDrawListener(listener);
                listener = null;
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (listener != null) {
            getBridge().getWebView().getViewTreeObserver().removeOnPreDrawListener(listener);
            listener = null;
        }
        targets.clear();
    }

    // Runs just before every frame: the ad and the page use the same scroll value.
    private void apply() {
        int scroll = getBridge().getWebView().getScrollY();
        for (Iterator<Map.Entry<String, Target>> it = targets.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, Target> entry = it.next();
            View view = find(entry.getKey());
            if (view == null || !(view.getLayoutParams() instanceof FrameLayout.LayoutParams)) continue;
            Target target = entry.getValue();
            int margin = ((FrameLayout.LayoutParams) view.getLayoutParams()).topMargin;
            float top = target.pageTop - scroll;
            float y = Math.round(top) - margin;
            if (view.getTranslationY() != y) view.setTranslationY(y);

            // The ad is shown only while the whole of it sits between the fixed bars: it cannot be clipped by the page.
            float height = view.getHeight() > 0 ? view.getHeight() : MREC_HEIGHT_DP * density();
            boolean inside = (target.clipTop < 0 || top >= target.clipTop) && (target.clipBottom < 0 || top + height <= target.clipBottom);
            int visibility = view.getVisibility();
            if (!inside && visibility == View.VISIBLE) {
                view.setVisibility(View.INVISIBLE);
                target.hiddenByFollow = true;
            } else if (inside && target.hiddenByFollow && visibility == View.INVISIBLE) {
                view.setVisibility(View.VISIBLE);
                target.hiddenByFollow = false;
            } else if (visibility == View.GONE) {
                // JS hid it on purpose; do not bring it back.
                target.hiddenByFollow = false;
            }
        }
    }

    // The MREC is a direct child of the window's content layout; find it by its MAX ad unit id.
    private View find(String unit) {
        ViewGroup content = getActivity().findViewById(android.R.id.content);
        if (content == null) return null;
        for (int i = 0; i < content.getChildCount(); i++) {
            View child = content.getChildAt(i);
            if (!child.getClass().getName().endsWith("MaxAdView")) continue;
            try {
                Method method = child.getClass().getMethod("getAdUnitId");
                if (unit.equals(method.invoke(child))) return child;
            } catch (Exception ignored) {
                // Not the class we expected; keep looking.
            }
        }
        return null;
    }

    private float density() {
        return getContext().getResources().getDisplayMetrics().density;
    }
}
