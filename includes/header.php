<?php
$pageTitle = $pageTitle ?? 'Wheeltrack';
$assetRoot = $assetRoot ?? '';
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/app.css?v=<?= @filemtime(dirname(__DIR__) . '/assets/css/app.css') ?>">
  </head>
  <body>
    <div id="app" class="app"></div>
