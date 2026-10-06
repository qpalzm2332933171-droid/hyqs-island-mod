package com.hymod;

import android.app.Activity;
import android.app.Application;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * 空 ContentProvider: 借系统在进程启动时调用 onCreate() 的时机注入菜单。
 * 同时把 APK 内打包好的 src/project.jsc 覆盖到热更目录, 防止被服务器热更覆盖。
 */
public class ModProvider extends ContentProvider {

    @Override public boolean onCreate() {
        try {
            final Context ctx = getContext();
            copyModJs(ctx);
            Application app = (Application) ctx.getApplicationContext();
            app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
                public void onActivityCreated(Activity a, Bundle b) { maybeAttach(a); }
                public void onActivityStarted(Activity a) {}
                public void onActivityResumed(Activity a) { maybeAttach(a); }
                public void onActivityPaused(Activity a) {}
                public void onActivityStopped(Activity a) {}
                public void onActivitySaveInstanceState(Activity a, Bundle b) {}
                public void onActivityDestroyed(Activity a) {}
            });
            Log.i(ModBridge.TAG, "ModProvider init ok");
        } catch (Throwable t) { Log.e(ModBridge.TAG, "provider " + t); }
        return true;
    }

    private void maybeAttach(Activity a) {
        try {
            if (a == null) return;
            String n = a.getClass().getName();
            if (n.contains("DYGame") || n.contains("Cocos2dxActivity")) ModMenu.get().attach(a);
        } catch (Throwable t) { Log.e(ModBridge.TAG, "attach " + t); }
    }

    /** 把 assets/src/project.jsc 复制覆盖到 files/<hash>/src/project.jsc (仅当目录已存在) */
    private void copyModJs(Context ctx) {
        try {
            File files = ctx.getFilesDir();
            if (files == null || !files.isDirectory()) return;
            File[] subs = files.listFiles();
            if (subs == null) return;
            int n = 0;
            for (File d : subs) {
                if (!d.isDirectory()) continue;
                File target = new File(d, "src/project.jsc");
                if (!target.exists()) continue;
                InputStream in = ctx.getAssets().open("src/project.jsc");
                FileOutputStream out = new FileOutputStream(target);
                byte[] buf = new byte[65536];
                int r;
                while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
                out.flush(); out.close(); in.close();
                n++;
            }
            Log.i(ModBridge.TAG, "copyModJs overwrite " + n + " file(s)");
        } catch (Throwable t) { Log.e(ModBridge.TAG, "copyModJs " + t); }
    }

    @Override public Cursor query(Uri u, String[] p, String s, String[] a, String o) { return null; }
    @Override public String getType(Uri u) { return null; }
    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
