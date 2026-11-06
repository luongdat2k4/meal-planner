package com.zl.pantrio.meal.plan.grocery;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MainActivity extends BridgeActivity {
    // AppLovin keeps the video and script files of every ad it has shown under files/al and never cleans them up.
    private static final long AD_CACHE_LIMIT_BYTES = 30L * 1024 * 1024;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Before the bridge starts the SDK is not running, so no cached file is in use.
        trimAdCache(new File(getFilesDir(), "al"), AD_CACHE_LIMIT_BYTES);
        registerPlugin(AdFollowPlugin.class);
        super.onCreate(savedInstanceState);

        // Ép bật DevTools (Inspect) trên Chrome cho app này
        WebView.setWebContentsDebuggingEnabled(false);
    }

    // Deletes the oldest files until the folder is within the limit.
    private static void trimAdCache(File dir, long limit) {
        if (!dir.isDirectory()) return;
        List<File> files = new ArrayList<>();
        collect(dir, files);
        long total = 0;
        for (File f : files) total += f.length();
        if (total <= limit) return;
        Collections.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
        for (File f : files) {
            if (total <= limit) break;
            long size = f.length();
            if (f.delete()) total -= size;
        }
    }

    private static void collect(File dir, List<File> out) {
        File[] children = dir.listFiles();
        if (children == null) return;
        for (File child : children) {
            if (child.isDirectory()) collect(child, out);
            else out.add(child);
        }
    }
}
