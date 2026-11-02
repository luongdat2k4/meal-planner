package com.alf.mealplanner;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ép bật DevTools (Inspect) trên Chrome cho app này
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
