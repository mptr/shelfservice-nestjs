import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { WorkflowCollectModule } from 'src/workflow-collect/workflow-collect.module';
import { K8sJobService } from './k8s-job.service';

@Module({
	imports: [ConfigModule, forwardRef(() => WorkflowCollectModule)],
	providers: [K8sJobService],
	exports: [K8sJobService],
})
export class KubernetesModule {}
