<?php
$screen = $screen ?? 'landing';
$assetRoot = $assetRoot ?? '';
?>
    <script>
      window.WHEELTRACK_PAGE = {
        screen: <?= json_encode($screen, JSON_UNESCAPED_SLASHES) ?>,
        root: <?= json_encode($assetRoot, JSON_UNESCAPED_SLASHES) ?>
      };
    </script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/config.js"></script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/form-state.js"></script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/india-locations.js"></script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/services.js"></script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/i18n.js"></script>
    <script src="<?= htmlspecialchars($assetRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/app.js"></script>
  </body>
</html>
